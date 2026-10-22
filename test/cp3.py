# CP3: uji Cerberus. Pakai: node server.js 8099 &  lalu  python3 test/cp3.py
import sys, json
from playwright.sync_api import sync_playwright
URL = 'http://localhost:%s/?nosw' % (sys.argv[1] if len(sys.argv) > 1 else '8099')
fails = []
def check(n, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + n + (' | ' + str(info) if info else ''))
    if not ok: fails.append(n)
JS = """
(opts) => {
  const G = PC.G, W = PC.World, R = { seen: {}, lanes: [], safeOk: [], hpLossInSafe: 0, cross: null };
  const step = () => PC.Game.step(1/60, 60);
  PC.Game.loadRoom(4, 3); const p = G.player; p.maxHp = p.hp = 9999; G.godmode = false;
  for (let i = 0; i < 240; i++) step(); const b = G.boss;
  R.name = b.name; R.pillars = W.room.pillars.length; R.maxHp = b.maxHp; R.hasHeads = !!PC.S.cerberus.roar;
  if (opts.ratio < 1) { b.hp = b.maxHp * opts.ratio; for (let i = 0; i < 60 * 4; i++) step(); }
  R.phase = b.phase;
  const cov = (z, x, y) => { if (z.shape === 'rect') { const dx = x - z.x, dy = y - z.y, c = Math.cos(z.a), s = Math.sin(z.a), lx = dx*c + dy*s, ly = -dx*s + dy*c; return lx > -4 && lx < z.len + 4 && Math.abs(ly) < z.w/2 + 4; } return false; };
  const safePoint = (zs, minD) => { let best = null, bd = 1e9; for (let x = 24; x < 392; x += 8) for (let y = 40; y < 200; y += 8) { if (W.hitsSolid(x, y, 6)) continue; if (Math.hypot(x - b.x, y - b.y) < minD) continue; if (zs.some(z => cov(z, x, y))) continue; const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; best = [x, y]; } } return best; };
  const oh = G.hurtPlayer; G.hurtPlayer = function (d) { if (held && d === 15) R.hpLossInSafe += d; return oh.apply(this, arguments); }; // hanya damage LAJUR (15); proyektil api/cincin bukan bagian cek ini
  const heads = new Set(); let lastLaneN = -1, held = null, hp0 = 0, dizzy = 0, rot = 0, bite = 0, fire = 0, cross = 0;
  for (let i = 0; i < 60 * opts.secs; i++) {
    const lanes = G.zones.filter(z => z.owner === b && z.shape === 'rect' && z.w === 14 && !z.fired), bands = G.zones.filter(z => z.owner === b && z.shape === 'rect' && z.w === 18 && !z.fired);
    if (lanes.length && !held && lanes[0].t > 0.55 && lanes[0].t < 0.7) { const sp = safePoint(lanes, 70); R.lanes.push(lanes.length); R.safeOk.push(!!sp); lanes.forEach(z => heads.add(z.color)); if (sp) { p.x = sp[0]; p.y = sp[1]; held = { sp, until: lanes[0].t, n: 0 }; hp0 = p.hp; } }
    if (held) { p.x = held.sp[0]; p.y = held.sp[1]; held.n++; if (!lanes.length && held.n > 30) { held = null; } }
    if (bands.length >= 2 && !R.cross) { const sp = safePoint(bands, 0); R.cross = { n: bands.length, safe: !!sp }; }
    p.hp = held ? p.hp : p.maxHp; if (p.state === 'dead') break;
    step(); if (G.state !== 'play') break;
    if (b.pose === 'dizzy' && b.vulnMul > 1) dizzy++;
    for (const z of G.zones) if (z.owner === b && z.shape === 'cone') { if (z.sweep) rot++; else if (z.range === 78) bite++; }
    for (const q of G.projs) if (q.hostile && q.col === '#ff7a2a') { fire++; break; }
  }
  R.heads = [...heads].sort(); R.dizzy = dizzy; R.rot = rot; R.bite = bite; R.fire = fire; R.err = G.lastError || null; R.hp = document.getElementById('hp-text').textContent;
  if (opts.kill) { b.hp = 1; G.damageEnemy(b, 50, { fromPlayer: true }); for (let i = 0; i < 60 * 6; i++) step(); R.killed = b.dead; R.cleared = G.rm.cleared; R.err2 = G.lastError || null; }
  return R;
}
"""
with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--no-sandbox']); errs = []; out = {}
    for name, o in [('p0', {'ratio': 1, 'secs': 150, 'kill': False}), ('p1', {'ratio': 0.6, 'secs': 150, 'kill': False}), ('p2', {'ratio': 0.3, 'secs': 150, 'kill': True})]:
        pg = b.new_page(viewport={'width': 800, 'height': 360}, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(400); pg.click('#m-play'); pg.wait_for_timeout(200); pg.click('#help-back'); pg.wait_for_timeout(300)
        out[name] = pg.evaluate(JS, o); print(name, json.dumps(out[name])[:600]); pg.close()
    a, c, d = out['p0'], out['p1'], out['p2']
    check('Cerberus asli (bukan SEMENTARA), 4 pilar, HP 1000, sprite 3 kepala', a['name'] == 'CERBERUS' and a['pillars'] == 4 and a['maxHp'] == 1000 and a['hasHeads'], (a['name'], a['pillars'], a['maxHp']))
    check('3 kepala dengan warna telegraph berbeda', len(a['heads']) == 3, a['heads'])
    check('fase 0/1/2 aktif sesuai HP', (a['phase'], c['phase'], d['phase']) == (0, 1, 2), (a['phase'], c['phase'], d['phase']))
    check('jumlah lajur 3 -> 4 -> 5 per fase', 3 in a['lanes'] and 4 in c['lanes'] and 5 in d['lanes'], (sorted(set(a['lanes'])), sorted(set(c['lanes'])), sorted(set(d['lanes']))))
    check('selalu ada titik aman (>=70 px) di antara lajur', all(a['safeOk'] + c['safeOk'] + d['safeOk']) and a['safeOk'], len(a['safeOk'] + c['safeOk'] + d['safeOk']))
    check('berdiri di titik aman -> 0 damage dari lajur', a['hpLossInSafe'] == 0 and c['hpLossInSafe'] == 0 and d['hpLossInSafe'] == 0, (a['hpLossInSafe'], c['hpLossInSafe'], d['hpLossInSafe']))
    check('palang silang punya area aman', all(x['cross'] and x['cross']['safe'] for x in (a, c)), (a['cross'], c['cross']))
    check('pola gigitan, proyektil api muncul', a['bite'] > 0 and a['fire'] > 0, (a['bite'], a['fire']))
    check('sapuan putar hanya fase>=1', a['rot'] == 0 and c['rot'] > 0, (a['rot'], c['rot']))
    check('jendela serang balik (dizzy x1.3) muncul', a['dizzy'] > 0 and c['dizzy'] > 0 and d['dizzy'] > 0, (a['dizzy'], c['dizzy'], d['dizzy']))
    check('boss mati -> ruangan bersih, tanpa crash', d.get('killed') and d.get('cleared') and d['err2'] is None, (d.get('killed'), d.get('cleared')))
    check('tanpa error JS / NaN', all(x['err'] is None and 'NaN' not in x['hp'] for x in out.values()) and not errs, errs)
    b.close()
print('\nHASIL:', 'SEMUA LULUS' if not fails else 'GAGAL: %s' % fails); sys.exit(1 if fails else 0)
