# CP5: uji Zeus. Pakai: node server.js 8099 &  lalu  python3 test/cp5.py
import sys, json
from playwright.sync_api import sync_playwright
URL = 'http://localhost:%s/?nosw' % (sys.argv[1] if len(sys.argv) > 1 else '8099')
fails = []
def check(n, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + n + (' | ' + str(info) if info else ''))
    if not ok: fails.append(n)
SETUP = "PC.Game.loadRoom(6, 3); const G = PC.G, W = PC.World, p = G.player; p.maxHp = p.hp = 9999; const step = () => PC.Game.step(1/60, 60); for (let i = 0; i < 240; i++) step(); const b = G.boss;"
# 1) simulasi tiap fase: pola, telegraph, titik aman, state tetap 'play'
SIM = "(ph) => {" + SETUP + """
  const R = { name: b.name, hp: b.maxHp, ph0: b.phase, kinds: {}, minDelay: 99, safe: 0, unsafe: 0, state: [], dead: false, wrath: 0 };
  G.godmode = true; if (ph > 0) { b.hp = b.maxHp * (ph === 1 ? 0.5 : 0.2); for (let i = 0; i < 300; i++) { step(); R.state.push(G.state + (G.cutscene ? 'C' : '') + (b.dead ? 'D' : '')); } }
  R.phase = b.phase; const seen = new Set(); let lastGroup = -9;
  for (let i = 0; i < 60 * 150; i++) {
    if (i % 240 === 0) { const a = Math.random() * 6.28, x = b.x + Math.cos(a) * 110, y = b.y + Math.sin(a) * 110; if (!W.hitsSolid(x, y, 6)) { p.x = x; p.y = y; } }
    step(); if (G.state !== 'play') { R.badState = G.state; break; }
    const zs = G.zones.filter(z => z.owner === b && !z.fired);
    for (const z of zs) if (!seen.has(z)) { seen.add(z); if (!z.warn) R.minDelay = Math.min(R.minDelay, z.delay); const k = z.shape === 'rect' ? (z.w === 15 ? 'beam' : 'lane') : z.r === 92 ? 'wrath' : z.r === 24 ? 'chain' : z.r === 32 ? 'bolt' : z.r === 30 ? 'rain' : z.shape; R.kinds[k] = (R.kinds[k] || 0) + 1; }
    if (zs.length && G.time - lastGroup > 1.2) { lastGroup = G.time; // ada titik aman <= 110 px dari pemain?
      let ok = false; const hit = (z, x, y) => { if (z.shape === 'circle') return Math.hypot(z.x - x, z.y - y) < z.r + 4; if (z.shape === 'cone') return false; const dx = x - z.x, dy = y - z.y, c = Math.cos(z.a), s = Math.sin(z.a), lx = dx * c + dy * s, ly = -dx * s + dy * c; return lx > -4 && lx < z.len + 4 && Math.abs(ly) < z.w / 2 + 4; };
      for (let a = 0; a < 6.28 && !ok; a += 0.2) for (let d = 0; d <= 110 && !ok; d += 10) { const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d; if (x > 14 && x < 402 && y > 18 && y < 210 && !W.hitsSolid(x, y, 5) && !zs.some(z => hit(z, x, y))) ok = true; }
      if (ok) R.safe++; else R.unsafe++; }
  }
  R.err = G.lastError || null; return R;
}"""
# 2) dodge: berdiri di petir vs dodge keluar
DODGE = "() => {" + SETUP + """
  const R = { stand: [], dodge: [], err: null }; let trial = 0, mode = null, hp0 = 0, done = false, tz = null, doneT = 0;
  for (let i = 0; i < 60 * 200 && trial < 12; i++) {
    if (!mode) { p.hp = p.maxHp; p.invuln = 0; const z = G.zones.find(z => z.owner === b && !z.fired && z.shape === 'circle' && z.r === 32 && z.delay >= 0.8); if (z) { mode = trial % 2 ? 'dodge' : 'stand'; trial++; tz = z; G.godmode = false; p.x = z.x; p.y = z.y; p.state = 'free'; p.hp = hp0 = p.maxHp; done = false; doneT = 0; } }
    if (mode === 'dodge' && !done && tz.t > tz.delay - 0.25) { PC.In.mx = 1; PC.In.my = 0; PC.In.press('dodge'); PC.In.held.dodge = false; done = true; }
    if (mode === 'stand' && !done) { p.x = tz.x; p.y = tz.y; }
    step(); if (G.state !== 'play') break;
    if (mode && tz.fired) { doneT++; if (doneT > 20) { (mode === 'dodge' ? R.dodge : R.stand).push(hp0 - p.hp); mode = null; PC.In.mx = PC.In.my = 0; G.godmode = true; } }
  }
  R.err = G.lastError || null; return R;
}"""
# 3) kekalahan Zeus & layar menang: tidak menang saat ganti fase
WIN = "() => {" + SETUP + """
  const R = { states: [], win: null }; G.godmode = true;
  b.hp = b.maxHp * 0.6; for (let i = 0; i < 300; i++) step(); R.p1 = b.phase; R.afterP1 = [G.state, b.dead];
  b.hp = b.maxHp * 0.3; for (let i = 0; i < 300; i++) step(); R.p2 = b.phase; R.afterP2 = [G.state, b.dead];
  for (let i = 0; i < 120; i++) step(); R.stillAlive = !b.dead && G.state === 'play';
  b.hp = 1; G.damageEnemy(b, 50, { fromPlayer: true }); R.deadNow = b.dead; R.stateAtDeath = G.state;
  for (let i = 0; i < 60 * 12; i++) { step(); if (G.state !== 'play') break; } R.final = G.state; R.err = G.lastError || null;
  R.winTxt = (document.getElementById('win') || document.body).innerText.slice(0, 120);
  return R;
}"""
def page(b, errs):
    pg = b.new_page(viewport={'width': 800, 'height': 360}, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400); pg.click('#m-play'); pg.wait_for_timeout(200); pg.click('#help-back'); pg.wait_for_timeout(300); return pg
with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--no-sandbox']); errs = []; out = {}
    for ph in (0, 1, 2):
        pg = page(b, errs); out[ph] = pg.evaluate(SIM, ph); print('fase', ph, json.dumps(out[ph])[:420]); pg.close()
    pg = page(b, errs); dd = pg.evaluate(DODGE); print('dodge', json.dumps(dd)); pg.close()
    pg = page(b, errs); ww = pg.evaluate(WIN); print('win', json.dumps(ww)); pg.close()
    r0, r1, r2 = out[0], out[1], out[2]
    check('Zeus asli (bukan SEMENTARA), HP 1500', r0['name'] == 'ZEUS' and r0['hp'] == 1500, (r0['name'], r0['hp']))
    check('fase 0/1/2 tercapai pada HP 100/50/20%', (r0['phase'], r1['phase'], r2['phase']) == (0, 1, 2), (r0['phase'], r1['phase'], r2['phase']))
    check('fase 0: petir terarah + lajur', r0['kinds'].get('bolt', 0) >= 3 and r0['kinds'].get('beam', 0) >= 1, r0['kinds'])
    check('fase 1: petir berulang (rain/chain/spokes)', r1['kinds'].get('rain', 0) >= 3 and r1['kinds'].get('chain', 0) >= 3 and r1['kinds'].get('lane', 0) >= 3, r1['kinds'])
    check('fase 2: murka + pola berat', r2['kinds'].get('wrath', 0) >= 1 and r2['kinds'].get('lane', 0) >= 8, r2['kinds'])
    check('telegraph >= 0.7 dtk untuk semua zona yang melukai', min(r['minDelay'] for r in (r0, r1, r2)) >= 0.7, [r['minDelay'] for r in (r0, r1, r2)])
    check('selalu ada titik aman <= 110 px (>=95%)', all(r['safe'] >= 5 and r['unsafe'] <= 0.05 * (r['safe'] + r['unsafe']) for r in (r0, r1, r2)), [(r['safe'], r['unsafe']) for r in (r0, r1, r2)])
    check('state tetap play saat ganti fase (tidak menang/mati)', all(not r.get('badState') for r in (r0, r1, r2)) and all(s == 'play' for s in r1['state'] + r2['state']), [r.get('badState') for r in (r0, r1, r2)])
    check('dodge keluar dari petir = 0 damage', len(dd['dodge']) >= 2 and all(x == 0 for x in dd['dodge']), dd['dodge'])
    check('kontrol: diam di petir kena damage', len(dd['stand']) >= 2 and all(x > 0 for x in dd['stand']), dd['stand'])
    check('ganti fase tidak memicu kemenangan', ww['p1'] == 1 and ww['p2'] == 2 and ww['afterP1'] == ['play', False] and ww['afterP2'] == ['play', False] and ww['stillAlive'], (ww['afterP1'], ww['afterP2']))
    check('Zeus kalah -> layar KEMENANGAN', ww['deadNow'] and ww['stateAtDeath'] == 'play' and ww['final'] == 'win', (ww['deadNow'], ww['stateAtDeath'], ww['final']))
    check('tanpa error JS', not errs and not any(r.get('err') for r in (r0, r1, r2)) and not dd['err'] and not ww['err'], errs[:2])
print('\nHASIL:', 'SEMUA LULUS' if not fails else 'GAGAL: %s' % fails)
