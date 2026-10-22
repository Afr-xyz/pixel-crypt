# CP2: uji Medusa. Pakai: node server.js 8099 &  lalu  python3 test/cp2.py
import sys, json
from playwright.sync_api import sync_playwright
URL = 'http://localhost:%s/?nosw' % (sys.argv[1] if len(sys.argv) > 1 else '8099')
fails = []
def check(n, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + n + (' | ' + str(info) if info else ''))
    if not ok: fails.append(n)
JS = """
() => {
  const G = PC.G, W = PC.World, R = {};
  const step = n => { for (let i = 0; i < n; i++) PC.Game.step(1/60, 60); };
  const until = (c, sec) => { for (let i = 0; i < sec * 60; i++) { PC.Game.step(1/60, 60); if (c()) return true; } return false; };
  const clear = (x0,y0,x1,y1) => { const n = Math.ceil(Math.hypot(x1-x0,y1-y0)/3); for (let i=1;i<n;i++){ const t=i/n; if (W.solidAt(x0+(x1-x0)*t,y0+(y1-y0)*t)) return false;} return true; };
  PC.Game.loadRoom(3, 3); const p = G.player; p.maxHp = p.hp = 9999; G.godmode = false; PC.Input = PC.In;
  step(60 * 4); const b = G.boss;
  R.boss = b ? b.name : null; R.pillars = W.room.pillars.length; R.statueBg = W.room.bossKind;
  // A: terkena tatapan -> membatu
  R.gzSeen = until(() => b.gz, 15);
  if (R.gzSeen) {
    for (const d of [90, 70, 110, 60, 130]) { const a = b.gz.a, x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d; if (!W.hitsSolid(x, y, 6) && clear(b.x, b.y, x, y)) { p.x = x; p.y = y; break; } }
    R.stoned = until(() => p.state === 'stone', 4); R.stoneMeterMax = p.stoneNeed;
    // C: mash 3x
    const hp0 = p.hp; let n = 0;
    let tFree = -1; let DX = -1, DY = 0; for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1]]) if ([6,12,18,24,30,36,42].every(d => !W.hitsSolid(p.x + dx * d, p.y + dy * d, 6))) { DX = dx; DY = dy; break; }
    if (R.stoned) { let t = 0; for (let k = 0; k < 3; k++) { PC.In.press('attack'); PC.In.held.attack = false; PC.In.mx = DX; PC.In.my = DY; for (let i = 0; i < 6; i++) { PC.Game.step(1/60, 60); t += 1/60; } }
      while (p.state === 'stone' && t < 2) { PC.In.mx = DX; PC.In.my = DY; PC.Game.step(1/60, 60); t += 1/60; } tFree = +t.toFixed(2); R.stoneImmune = p.stoneImmune > 0; }
    R.tFree = tFree; R.freedFast = tFree > 0 && tFree < 1.0; PC.In.mx = DX; PC.In.my = DY; step(120); PC.In.mx = 0; PC.In.my = 0; R.hpAfterMash = p.hp - hp0;
  }
  // E: tanpa mash -> pecahan memberi damage
  step(60 * 3); R.gz2 = until(() => b.gz && b.gz.st !== 'on', 15);
  if (R.gz2) { for (const d of [90, 70, 110, 60]) { const a = b.gz.a, x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d; if (!W.hitsSolid(x, y, 6) && clear(b.x, b.y, x, y)) { p.x = x; p.y = y; break; } }
    p.stoneImmune = 0; const hp1 = p.hp; R.stoned2 = until(() => p.state === 'stone', 4); step(60 * 3); R.shatterDmg = hp1 - p.hp; R.freedByShatter = p.state !== 'stone'; }
  // B: berlindung di balik pilar
  step(60 * 3); R.gz3 = until(() => b.gz && b.gz.st === 'tele', 20); R.cover = null;
  if (R.gz3) { p.stoneImmune = 0; let best = null;
    for (const pl of W.room.pillars) { const dx = pl.x - b.x, dy = (pl.y - 8) - b.y, L = Math.hypot(dx, dy); if (L < 40 || L > 200) continue; const x = pl.x + dx / L * 14, y = pl.y - 8 + dy / L * 14; if (!W.hitsSolid(x, y, 5) && !clear(b.x, b.y, x, y)) { best = [x, y]; break; } }
    if (best) { p.x = best[0]; p.y = best[1]; let max = 0, stoned = false; while (b.gz) { PC.Game.step(1/60, 60); p.x = best[0]; p.y = best[1]; max = Math.max(max, p.stoning); if (p.state === 'stone') stoned = true; }
      R.cover = { stoned, maxMeter: +max.toFixed(2) }; R.dizzy = until(() => b.pose === 'dizzy' && b.vulnMul > 1, 2); R.vulnMul = b.vulnMul; } else R.cover = 'no-cover-point'; }
  // F: fase 2 + semua pola dalam simulasi panjang
  b.hp = b.maxHp * 0.4; step(60 * 4); R.phase = b.phase;
  const seen = { gaze: 0, sweep: 0, volley: 0, tail: 0 };
  for (let i = 0; i < 60 * 240; i++) {
    if (i % 180 === 0 && p.state === 'free') { p.stoneImmune = 0; const ang = Math.random() * 6.28; const x = b.x + Math.cos(ang) * 60, y = b.y + Math.sin(ang) * 60; if (!W.hitsSolid(x, y, 6)) { p.x = x; p.y = y; } }
    p.hp = p.maxHp; PC.Game.step(1/60, 60); if (G.state !== 'play') break;
    if (b.gz) { if (b.gz.arc) seen.sweep++; else seen.gaze++; }
    for (const z of G.zones) if (z.owner === b && z.shape === 'circle' && z.r === 48) seen.tail++;
    for (const q of G.projs) if (q.hostile && q.col === '#7dff4a') { seen.volley++; break; }
  }
  R.seen = seen; R.err = G.lastError || null; R.hpTxt = document.getElementById('hp-text').textContent; R.bossHp = Math.round(b.hp);
  return R;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox']); errs = []
    pg = b.new_page(viewport={'width': 800, 'height': 360}, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400); pg.click('#m-play'); pg.wait_for_timeout(200); pg.click('#help-back'); pg.wait_for_timeout(300)
    R = pg.evaluate(JS); print(json.dumps(R))
    check('Medusa asli (bukan SEMENTARA), arena 5 pilar', R['boss'] == 'MEDUSA' and R['pillars'] == 5 and R['statueBg'] == 'medusa', (R['boss'], R['pillars']))
    check('telegraph tatapan muncul', R['gzSeen'])
    check('terkena tatapan -> membatu', R.get('stoned'))
    check('mash 3x membebaskan cepat + kebal sesaat', R.get('freedFast') and R.get('stoneImmune'))
    check('bebas lewat mash tidak kena pecahan', R.get('hpAfterMash') == 0, R.get('hpAfterMash'))
    check('tanpa mash: pecahan memberi damage ~26 & membebaskan', R.get('stoned2') and R.get('shatterDmg') == 26 and R.get('freedByShatter'), (R.get('shatterDmg'),))
    check('berlindung di balik pilar -> tidak membatu', isinstance(R['cover'], dict) and not R['cover']['stoned'] and R['cover']['maxMeter'] == 0, R['cover'])
    check('tatapan terhindar -> fase rentan (dizzy, vulnMul>1)', R.get('dizzy'), R.get('vulnMul'))
    check('fase 2 aktif di HP<=50%', R['phase'] == 1, R['phase'])
    s = R['seen']; check('semua pola terlihat (tatapan, sapuan, volley, ekor)', all(v > 0 for v in s.values()), s)
    check('tanpa error JS / NaN', R['err'] is None and 'NaN' not in R['hpTxt'] and not errs, (R['err'], errs))
    pg.screenshot(path='/tmp/cp2_end.png'); b.close()
print('\nHASIL:', 'SEMUA LULUS' if not fails else 'GAGAL: %s' % fails); sys.exit(1 if fails else 0)
