# CP4: uji Minotaur. Pakai: node server.js 8099 &  lalu  python3 test/cp4.py
import sys, json
from playwright.sync_api import sync_playwright
URL = 'http://localhost:%s/?nosw' % (sys.argv[1] if len(sys.argv) > 1 else '8099')
fails = []
def check(n, ok, info=''):
    print(('PASS ' if ok else 'FAIL ') + n + (' | ' + str(info) if info else ''))
    if not ok: fails.append(n)
SETUP = "PC.Game.loadRoom(5, 3); const G = PC.G, W = PC.World, p = G.player; p.maxHp = p.hp = 9999; const step = () => PC.Game.step(1/60, 60); for (let i = 0; i < 240; i++) step(); const b = G.boss;"
SIM = "(o) => {" + SETUP + """
  const R = { name: b.name, pillars: W.room.pillars.length, maxHp: b.maxHp, tele: [], ang: [], charges: 0, dizzyWall: 0, dizzyPillar: 0, rubble: 0, ring: 0, punch: 0, stomp: 0 };
  G.godmode = true; if (o.ratio < 1) { b.hp = b.maxHp * o.ratio; for (let i = 0; i < 240; i++) step(); } R.phase = b.phase;
  let prev = false, laneFirst = null, laneA = 0, x0 = 0, y0 = 0, chk = -1, dz = false, seenBlocked = 0;
  for (let i = 0; i < 60 * o.secs; i++) {
    if (i % 200 === 0) { const a = Math.random() * 6.28, x = b.x + Math.cos(a) * 110, y = b.y + Math.sin(a) * 110; if (!W.hitsSolid(x, y, 6)) { p.x = x; p.y = y; } }
    step(); if (G.state !== 'play') break;
    const lane = G.zones.find(z => z.owner === b && z.shape === 'rect' && z.warn && z.w === 38);
    if (lane) { if (laneFirst === null) laneFirst = G.time; laneA = lane.a; } else if (!b.contactDmg) laneFirst = laneFirst && b.pose === 'slam' ? laneFirst : null;
    const ch = b.contactDmg > 0;
    if (ch && !prev) { R.charges++; R.tele.push(+(G.time - (laneFirst === null ? G.time : laneFirst)).toFixed(2)); x0 = b.x; y0 = b.y; chk = 9; }
    if (chk > 0 && --chk === 0) { let d = Math.atan2(b.y - y0, b.x - x0) - laneA; d = Math.atan2(Math.sin(d), Math.cos(d)); R.ang.push(+Math.abs(d).toFixed(3)); }
    if (!ch && prev) laneFirst = null;
    prev = ch;
    if (b.pose === 'dizzy' && !dz) { dz = true; if (b.vulnMul >= 1.55) R.dizzyPillar++; else if (b.vulnMul >= 1.35) R.dizzyWall++; } if (b.pose !== 'dizzy') dz = false;
    for (const z of G.zones) if (z.owner === b) { if (z.shape === 'cone' && z.range === 58 && z.t < 0.02) R.punch++; if (z.shape === 'circle' && z.r === 64 && z.t < 0.02) R.stomp++; if (z.shape === 'circle' && z.r === 20 && z.t < 0.02) R.rubble++; }
    if (G.rings.length) R.ring++;
  }
  R.err = G.lastError || null; R.hp = document.getElementById('hp-text').textContent;
  if (o.kill) { b.hp = 1; G.damageEnemy(b, 50, { fromPlayer: true }); for (let i = 0; i < 360; i++) step(); R.killed = b.dead; R.cleared = G.rm.cleared; R.err2 = G.lastError || null; }
  return R;
}"""
DODGE = "() => {" + SETUP + """
  G.godmode = false; const R = { dodge: [], stand: [] }; let md = 999, Dm = 0, bx0 = 0, by0 = 0, trial = 0, prev = false, laneA = 0, mode = null, hp0 = 0, dodged = false;
  for (let i = 0; i < 60 * 240 && trial < 18; i++) {
    if (!mode && i % 200 === 0) { const a = Math.random() * 6.28, x = b.x + Math.cos(a) * 120, y = b.y + Math.sin(a) * 120; if (!PC.World.hitsSolid(x, y, 6)) { p.x = x; p.y = y; } }
    const lane = G.zones.find(z => z.owner === b && z.shape === 'rect' && z.warn && z.w === 38); if (lane) laneA = lane.a;
    const ch = b.contactDmg > 0;
    if (ch && !prev) md = 999; if (ch) md = Math.min(md, Math.hypot(b.x - p.x, b.y - p.y)); if (ch && !prev) { const L = PC.World.rayEnd(b.x, b.y, laneA, 420, b.r); if (L >= 120) { const D = Math.min(150, L - 25); Dm = D; bx0 = b.x; by0 = b.y; mode = trial % 2 === 0 ? 'dodge' : 'stand'; trial++; p.x = b.x + Math.cos(laneA) * D; p.y = b.y + Math.sin(laneA) * D; p.hp = hp0 = p.maxHp; p.st = p.maxSt; p.invuln = 0; p.state = 'free'; dodged = false; } else { mode = null; R.skip = (R.skip || 0) + 1; } }
    if (ch && mode === 'dodge' && !dodged && Math.hypot(b.x - p.x, b.y - p.y) < 110) { PC.In.mx = -Math.sin(laneA); PC.In.my = Math.cos(laneA); PC.In.press('dodge'); PC.In.held.dodge = false; dodged = true; }
    if (!ch && prev && mode) { if (Math.hypot(b.x - bx0, b.y - by0) >= 0.6 * Dm && (mode === 'dodge' || md < 40)) (mode === 'dodge' ? R.dodge : R.stand).push(hp0 - p.hp); else R.short = (R.short || 0) + 1; mode = null; PC.In.mx = PC.In.my = 0; }
    if (!mode) p.hp = p.maxHp;
    prev = ch; PC.Game.step(1/60, 60); if (G.state !== 'play') break;
    if (mode && !ch && !prev) { /* menunggu seruduk berikutnya */ }
  }
  R.err = G.lastError || null; return R;
}"""
APPROACH = "() => {" + SETUP + """
  G.godmode = true; const R = { times: [] };
  for (const [px, py, bx, by] of [[40, 60, 380, 200], [40, 190, 380, 50], [380, 50, 40, 190], [380, 200, 40, 60], [200, 120, 380, 50], [60, 120, 340, 120]]) {
    b.x = bx; b.y = by; PC.World.unstick(b); p.x = px; p.y = py; let t = 0, ok = false;
    for (let i = 0; i < 60 * 40; i++) { p.x = px; p.y = py; step(); t += 1/60; if (Math.hypot(b.x - px, b.y - py) < 110) { ok = true; break; } }
    R.times.push(ok ? +t.toFixed(1) : -1);
  }
  R.err = G.lastError || null; return R;
}"""
def page(b, errs):
    pg = b.new_page(viewport={'width': 800, 'height': 360}, has_touch=True); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400); pg.click('#m-play'); pg.wait_for_timeout(200); pg.click('#help-back'); pg.wait_for_timeout(300); return pg
with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--no-sandbox']); errs = []; out = {}
    for name, o in [('p0', {'ratio': 1, 'secs': 200, 'kill': False}), ('p1', {'ratio': 0.4, 'secs': 200, 'kill': True})]:
        pg = page(b, errs); out[name] = pg.evaluate(SIM, o); print(name, json.dumps(out[name])[:500]); pg.close()
    pg = page(b, errs); dd = pg.evaluate(DODGE); print('dodge', json.dumps(dd)); pg.close()
    pg = page(b, errs); ap = pg.evaluate(APPROACH); print('approach', json.dumps(ap)); pg.close()
    a, c = out['p0'], out['p1']
    check('Minotaur asli, 7 pilar, HP 1000', a['name'] == 'MINOTAUR' and a['pillars'] == 7 and a['maxHp'] == 1000, (a['name'], a['pillars'], a['maxHp']))
    check('seruduk terjadi berulang (>=6 dalam 200 dtk)', a['charges'] >= 6, (a['charges'], c['charges']))
    check('selalu ada telegraph >= 0.85 dtk sebelum seruduk', all(t >= 0.85 for t in a['tele'] + c['tele']) and a['tele'], (min(a['tele'] + c['tele'] or [0]),))
    check('arah seruduk = arah lajur terkunci (<0.15 rad)', len(a['ang'] + c['ang']) >= 6 and sum(1 for x in a['ang'] + c['ang'] if x < 0.15) >= 0.85 * len(a['ang'] + c['ang']), (max(a['ang'] + c['ang'] or [9]),))
    check('tabrakan -> pusing rentan (dinding dan pilar)', a['dizzyWall'] + c['dizzyWall'] > 0 and a['dizzyPillar'] + c['dizzyPillar'] > 0, (a['dizzyWall'] + c['dizzyWall'], a['dizzyPillar'] + c['dizzyPillar']))
    check('hentakan, pukulan muncul; fase 1: gelombang+puing+seruduk ganda', a['stomp'] > 0 and a['punch'] > 0 and c['phase'] == 1 and c['ring'] > 0 and c['rubble'] > 0, (a['stomp'], a['punch'], c['phase'], c['ring'], c['rubble']))
    check('dodge tegak lurus lolos seruduk (>=75% tanpa damage)', len(dd['dodge']) >= 2 and sum(1 for x in dd['dodge'] if x == 0) >= 0.75 * len(dd['dodge']), dd['dodge'])
    check('kontrol: diam di lajur terkena (damage > 0)', len(dd['stand']) >= 2 and sum(1 for x in dd['stand'] if x > 0) >= 0.6 * len(dd['stand']), dd['stand'])
    check('tidak tersangkut: mendekati pemain diam <= 30 dtk', all(0 < t <= 30 for t in ap['times']), ap['times'])
    check('boss mati -> ruangan bersih tanpa crash', c.get('killed') and c.get('cleared') and c['err2'] is None, (c.get('killed'), c.get('cleared')))
    check('tanpa error JS / NaN', all(x['err'] is None and 'NaN' not in x['hp'] for x in (a, c)) and dd['err'] is None and ap['err'] is None and not errs, errs)
    b.close()
print('\nHASIL:', 'SEMUA LULUS' if not fails else 'GAGAL: %s' % fails); sys.exit(1 if fails else 0)
