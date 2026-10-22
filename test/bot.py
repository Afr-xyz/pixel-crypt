# Uji simulasi: bot memainkan seluruh game (mode kebal) lalu bot tanpa dodge (harus bisa mati).
import sys, json
from playwright.sync_api import sync_playwright
BOT = """
(opts) => {
  const G = PC.G, In = PC.In, C = PC.C; G.godmode = !!opts.god; const log = {rooms: [], bosses: {}, perks: 0};
  const maxSteps = opts.maxSec * 60; let steps = 0, lastKey = '', wander = 0, wa = 0, ref = [0, 0];
  while (steps < maxSteps) {
    steps++;
    if (G.state === 'perk') { PC.Game.choosePerk(C.PERKS[Math.floor(Math.random() * C.PERKS.length)]); log.perks++; }
    if (G.state !== 'play') break;
    const p = G.player, rm = G.rm, key = rm ? rm.floor + '-' + rm.idx : '';
    if (key !== lastKey) { lastKey = key; log.rooms.push(key + '@' + Math.round(G.run.time) + 's'); }
    let tgt = null, bd = 1e9;
    for (const e of G.enemies) { if (e.dead || e.untargetable || e.spawning) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; tgt = e; } }
    In.mx = In.my = 0;
    if (steps % 40 === 0) { if (Math.hypot(p.x - ref[0], p.y - ref[1]) < 3 && (tgt ? bd > 30 : true)) { wander = 50; wa = Math.random() * 6.28; } ref = [p.x, p.y]; }
    if (wander > 0) { wander--; In.mx = Math.cos(wa); In.my = Math.sin(wa); In.held.attack = !!tgt; PC.Game.step(1 / 60, 60); continue; }
    if (tgt) {
      const a = Math.atan2(tgt.y - p.y, tgt.x - p.x);
      if (bd > 24 + tgt.r) { In.mx = Math.cos(a); In.my = Math.sin(a); }
      In.held.attack = true; In.buf.attack = 0.1;
      if (p.mp > 45 && bd < 55 && p.cd[0] <= 0) In.press('s0');
      if (p.mp > 20 && bd > 50 && bd < 150 && p.cd[1] <= 0) In.press('s1');
      if (p.mp > 40 && p.cd[2] <= 0 && bd < 60) In.press('s2');
      if (0 && opts.dodge && p.hp < p.maxHp && Math.random() < 0.02) In.press('dodge');
      if (p.hp < p.maxHp * 0.4 && p.potions > 0) In.press('potion');
    } else if (rm && rm.cleared) { const ty = p.x < 370 ? (p.y < 112 ? 70 : 165) : 112; const a = Math.atan2(ty - p.y, 408 - p.x); In.mx = Math.cos(a); In.my = Math.sin(a); In.held.attack = false; }
    PC.Game.step(1 / 60, 60);
    if (G.boss && !G.boss.dead) log.bosses[G.boss.type] = Math.round(G.boss.hp);
  }
  log.state = G.state; log.floor = G.run.floor; log.room = G.run.room; log.kills = G.run.kills; log.sec = Math.round(G.run.time); log.hp = Math.round(G.player.hp); log.err = G.lastError || null; log.perfects = G.run.perfects; log.dmg = G.run.damageTaken;
  return log;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox']); errs = []
    for label, opts in [('GOD (bot kebal)', {'god': True, 'maxSec': 6000, 'dodge': False}), ('NAIF (tanpa dodge)', {'god': False, 'maxSec': 600, 'dodge': False})]:
        pg = b.new_page(viewport={'width': 800, 'height': 360}, has_touch=True)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('http://localhost:8099/?nosw'); pg.wait_for_timeout(500)
        pg.click('#m-play'); pg.wait_for_timeout(200); pg.click('#help-back'); pg.wait_for_timeout(300)
        r = pg.evaluate(BOT, opts)
        print('==', label); print(json.dumps(r, indent=1))
        if label.startswith('GOD'): pg.screenshot(path='/tmp/s_end.png')
        pg.close()
    print('pageerrors:', errs)
    b.close()
