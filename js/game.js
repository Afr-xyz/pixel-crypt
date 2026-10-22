// Alur game: run, ruangan, gelombang musuh, loop utama, render, kamera/layar.
window.PC = window.PC || {};
(function (PC) {
  const G = PC.G, U = PC.U, C = PC.C, W = PC.World, S = PC.S, In = PC.In, E = PC.Enemies, B = PC.Bosses, Pl = PC.Player;
  const { clamp, dist, rand } = U;
  G.state = 'menu'; G.time = 0; G.W = 416; G.H = 224; G.ox = 0; G.oy = 0; G.cutscene = false; G.godmode = false;
  G.banner = G.banner || function () {}; G.toast = G.toast || function () {};

  const Game = PC.Game = {
    init(canvas) {
      G.canvas = canvas; G.ctx = canvas.getContext('2d', { alpha: false }); S.build(); G.reset();
      Game.resize(); addEventListener('resize', Game.resize); addEventListener('orientationchange', () => setTimeout(Game.resize, 150));
      Game.menuScene(); G.last = performance.now(); requestAnimationFrame(Game.frame);
    },
    resize() {
      const vw = Math.max(1, window.innerWidth), vh = Math.max(1, window.innerHeight), a = vw / vh, rw = C.ROOM_W, rh = C.ROOM_H;
      let w, h; if (a >= rw / rh) { h = rh; w = Math.round(rh * a); } else { w = rw; h = Math.round(rw / a); }
      G.W = w; G.H = h; G.ox = Math.round((w - rw) / 2); G.oy = Math.round((h - rh) / 2);
      G.canvas.width = w; G.canvas.height = h; G.ctx.imageSmoothingEnabled = false;
      const v = document.createElement('canvas'); v.width = w; v.height = h; const g = v.getContext('2d');
      const gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.65); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.62)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h); G.vig = v;
      const d = document.createElement('canvas'); d.width = w; d.height = h; const g2 = d.getContext('2d');
      const gr2 = g2.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.6); gr2.addColorStop(0, 'rgba(255,0,0,0)'); gr2.addColorStop(1, 'rgba(255,20,20,0.8)');
      g2.fillStyle = gr2; g2.fillRect(0, 0, w, h); G.dangerVig = d;
    },
    menuScene() {
      G.state = 'menu'; G.run = { floor: 0, room: 0, kills: 0, gold: 0, perks: [], perfects: 0, damageTaken: 0, time: 0 };
      G.reset(); W.make(U.choice(['crypt', 'swamp', 'inferno'])); G.player = Pl.create(); G.player.x = 120; G.player.y = 130; G.rm = null; W.setDoor(false);
      PC.Audio.music('menu');
    },

    // ---------- Run ----------
    startRun() {
      PC.Save.data.runs++; PC.Save.save();
      G.run = { floor: 0, room: 0, kills: 0, gold: 0, perks: [], perfects: 0, damageTaken: 0, time: 0 };
      G.reset(); G.cutscene = false; G.player = Pl.create(); In.clear(); if (In.resetStick) In.resetStick();
      Game.loadRoom(0, 0); G.state = 'play';
    },
    loadRoom(floor, idx) {
      const F = C.FLOORS[floor], boss = idx === C.ROOMS_PER_FLOOR;
      G.run.floor = floor; G.run.room = idx;
      G.enemies = []; G.projs = []; G.zones = []; G.parts = []; G.texts = []; G.pickups = []; G.fx = []; G.rings = []; G.boss = null; G.cutscene = false; G.bossDeath = null;
      W.make(F.theme, boss, boss ? F.boss : undefined); Pl.startRoom(G.player); G.player.cd = G.player.cd.map(c => Math.min(c, 2));
      G.rm = { floor, idx, boss, t: 0, waves: boss ? [] : Game.makeWaves(floor, idx), wave: 0, spawnQ: [], spawnT: 0, waveDelay: 1.0, cleared: false, bossT: 1.0, clearT: 0 };
      PC.Audio.music(boss ? 'boss' : 'explore');
      if (idx === 0) G.banner('LANTAI ' + (floor + 1), F.name); else if (boss) G.banner('RUANG BOSS', 'Bersiaplah...'); else G.toast('RUANGAN ' + (idx + 1));
    },
    makeWaves(floor, idx) {
      const F = C.FLOORS[floor]; let left = F.budget + idx * 2; const list = [];
      while (left > 0 && list.length < 14) { const opts = F.pool.filter(t => C.ENEMY[t].cost <= left); if (!opts.length) break; const t = U.choice(opts); list.push({ type: t }); left -= C.ENEMY[t].cost; }
      const split = Math.ceil(list.length * 0.55), w = [list.slice(0, split), list.slice(split)];
      if (idx === C.ROOMS_PER_FLOOR - 1 && w[1].length) { const strong = w[1].reduce((a, b) => (C.ENEMY[b.type].cost > C.ENEMY[a.type].cost ? b : a)); strong.elite = true; }
      return w.filter(x => x.length);
    },
    clearRoom() {
      const rm = G.rm; if (rm.cleared) return; rm.cleared = true; rm.clearT = 0; W.setDoor(true); PC.Audio.play('door');
      G.run.gold += rm.boss ? 0 : 10; G.toast(rm.boss ? 'BOSS DIKALAHKAN!' : 'RUANGAN BERSIH!');
      if (!rm.boss && rm.idx === C.ROOMS_PER_FLOOR - 1) { const p = G.player; p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.3)); p.mp = p.maxMp; if (p.potions < 3) p.potions++; G.text(p.x, p.y - 16, 'ISTIRAHAT', '#6aff8a', 2); }
      rm.perkT = 0.9;
    },
    nextRoom() {
      const rm = G.rm; let f = rm.floor, i = rm.idx + 1;
      if (i > C.ROOMS_PER_FLOOR) { f++; i = 0; }
      if (f >= C.FLOORS.length) { Game.win(); return; }
      Game.fade(() => {
        if (i === 0) { const p = G.player; p.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * 0.35)); p.mp = p.maxMp; p.potions = Math.min(5, p.potions + 1); }
        Game.loadRoom(f, i); Game.bank(false);
      });
    },
    fade(cb) { G.fadeT = { a: 0, dir: 1, cb }; },
    bank(final) { // simpan emas & rekor
      const s = PC.Save.data, r = G.run; s.gold += r.gold - (r.banked || 0); r.banked = r.gold;
      const sc = r.floor * 10 + r.room, bs = s.best.floor * 10 + s.best.room; if (sc > bs) s.best = { floor: r.floor, room: r.room }; PC.Save.save();
    },
    win() {
      if (G.state === 'win') return; G.state = 'win'; G.run.won = true; PC.Save.data.wins++; Game.bank(true); PC.Audio.music(null); PC.Audio.play('win'); In.clear();
      if (PC.UI) PC.UI.showWin();
    },
    pause() {
      if (G.state === 'play') { G.state = 'paused'; In.clear(); if (In.resetStick) In.resetStick(); PC.Audio.pauseMusic(); if (PC.UI) PC.UI.showPause(); }
      else if (G.state === 'paused') Game.resume();
    },
    resume() { if (G.state === 'paused') { G.state = 'play'; G.last = performance.now(); PC.Audio.resumeMusic(); if (PC.UI) PC.UI.hidePause(); } },
    quitRun() { Game.bank(true); PC.Audio.music(null); Game.menuScene(); if (PC.UI) PC.UI.showMenu(); },

    // ---------- Perk ----------
    offerPerks() {
      const picks = U.shuffle(C.PERKS).slice(0, 3); G.state = 'perk'; In.clear(); if (In.resetStick) In.resetStick(); PC.Audio.play('perk');
      if (PC.UI) PC.UI.showPerks(picks);
    },
    choosePerk(perk) { perk.a(G.player); G.run.perks.push(perk.id); G.state = 'play'; G.last = performance.now(); G.text(G.player.x, G.player.y - 16, perk.name.toUpperCase(), '#ffe066'); PC.Audio.play('pickup'); },

    // ---------- Kematian & boss ----------
    onPlayerDeath() {
      G.slowmo(1.2, 0.3); In.clear(); PC.Audio.music(null); PC.Audio.play('lose'); G.deathT = 1.5;
    },
    finishDeath() { G.state = 'over'; Game.bank(true); if (PC.UI) PC.UI.showOver(); },
  };
  G.onPlayerDeath = Game.onPlayerDeath;

  G.onBossDeath = function (e) {
    G.cutscene = true; G.zones.length = 0; G.projs.length = 0; G.rings.length = 0; for (const m of G.enemies) if (m !== e && !m.dead) { m.dead = true; G.burst(m.x, m.y, 8, '#fff', 60, 0.4, 1); }
    G.bossDeath = { t: 0, e, n: 0 }; G.slowmo(2.2, 0.45); PC.Audio.music(null); PC.Save.data.bossKills[e.type] = (PC.Save.data.bossKills[e.type] || 0) + 1; G.run.gold += C.BOSS[e.type].gold;
  };

  // ---------- Update ----------
  function updateRoom(dt) {
    const rm = G.rm, p = G.player; if (!rm) return; rm.t += dt;
    if (rm.boss) {
      if (!G.boss && rm.t >= rm.bossT && !rm.cleared) B.spawn(C.FLOORS[rm.floor].boss);
    } else if (!rm.cleared) {
      const alive = G.enemies.filter(e => !e.dead).length;
      if (rm.spawnQ.length) {
        rm.spawnT -= dt;
        if (rm.spawnT <= 0 && alive < 9) { const q = rm.spawnQ.shift(), d = C.ENEMY[q.type], pos = W.randomFree(d.r, p, 95); E.spawn(q.type, pos.x, pos.y, { elite: q.elite }); rm.spawnT = 0.28; }
      } else if (alive === 0) {
        rm.waveDelay -= dt;
        if (rm.waveDelay <= 0) { if (rm.wave < rm.waves.length) { rm.spawnQ = rm.waves[rm.wave++].slice(); rm.spawnT = 0; rm.waveDelay = 1.0; if (rm.wave > 1) G.toast('GELOMBANG ' + rm.wave + '/' + rm.waves.length); } else Game.clearRoom(); }
      }
    }
    if (rm.cleared) {
      if (rm.perkT !== undefined) { rm.perkT -= dt; if (rm.perkT <= 0) { rm.perkT = undefined; if (!(rm.boss && rm.floor === C.FLOORS.length - 1)) Game.offerPerks(); else Game.win(); } }
      if (W.room.doorOpen && p.state !== 'dead' && p.x > C.ROOM_W - 15 && p.y > 88 && p.y < 134 && !G.fadeT && rm.perkT === undefined && G.state === 'play') Game.nextRoom();
    }
  }
  function updateBossDeath(raw) {
    const d = G.bossDeath; d.t += raw; const e = d.e;
    if (d.t > d.n * 0.12 && d.t < 2.2) { d.n++; const x = e.x + rand(-e.r, e.r), y = e.y + rand(-e.r * 1.4, e.r * 0.6); G.burst(x, y, 10, ['#ffd060', '#ff7a2a', '#fff', '#e8e0cc'], 110, 0.6, 2); G.addShake(3); if (d.n % 3 === 0) PC.Audio.play('explode'); }
    if (d.t >= 2.2 && !d.done) {
      d.done = true; G.cutscene = false; for (let i = 0; i < 26; i++) G.drop(e.x, e.y, 'coin', 4); G.drop(e.x, e.y, 'heart'); G.drop(e.x, e.y, 'heart'); G.addShake(8); G.flash('#fff', 0.8);
      G.enemies = G.enemies.filter(x => x !== e); G.boss = null; G.bossDone = true; PC.Audio.play('door'); PC.Audio.music('explore'); Game.clearRoom();
    }
  }
  function updatePlay(raw) {
    In.update(raw);
    if (G.fadeT) { const f = G.fadeT; f.a += f.dir * raw * 3.2; if (f.dir > 0 && f.a >= 1) { f.a = 1; f.dir = -1; f.cb(); } else if (f.dir < 0 && f.a <= 0) G.fadeT = null; if (f.dir > 0) return; }
    if (G.hitstop > 0) { G.hitstop -= raw; G.shake *= 0.9; return; }
    let ts = 1; if (G.slow.t > 0) { G.slow.t -= raw; ts = G.slow.scale; }
    const dt = Math.min(raw, 1 / 30) * ts; G.time += dt; G.run.time += raw; G.flashA = Math.max(0, G.flashA - raw * 1.6); G.shake = Math.max(0, G.shake - raw * 22);
    Pl.update(G.player, dt);
    for (const e of G.enemies) if (!e.dead) (e.boss ? E.update(e, dt) : E.update(e, dt));
    G.enemies = G.enemies.filter(e => !e.dead || (e.boss && G.bossDeath && !G.bossDeath.done));
    G.updateWorldFx(dt);
    if (G.bossDeath && !G.bossDeath.done) updateBossDeath(raw);
    updateRoom(dt);
    if (G.deathT !== undefined && G.player.state === 'dead') { G.deathT -= raw; if (G.deathT <= 0) { G.deathT = undefined; Game.finishDeath(); } }
  }

  // ---------- Render ----------
  function draw() {
    const ctx = G.ctx, W_ = G.W, H_ = G.H, rm = W.room;
    ctx.fillStyle = rm ? PC.S.THEMES[rm.theme].fog : '#0b0b14'; ctx.fillRect(0, 0, W_, H_);
    if (!rm) return;
    const sx = G.shake > 0.1 ? Math.round(rand(-G.shake, G.shake) * 0.5) : 0, sy = G.shake > 0.1 ? Math.round(rand(-G.shake, G.shake) * 0.5) : 0;
    ctx.save(); ctx.translate(G.ox + sx, G.oy + sy);
    ctx.drawImage(rm.bg, 0, 0); W.drawTorches(ctx, G.time); W.drawDoor(ctx);
    G.drawZones(ctx, G.time);
    const list = [];
    for (const p of rm.pillars) list.push({ y: p.y, f: () => S.draw(ctx, S.pillar[rm.theme], p.x, p.y) });
    for (const k of G.pickups) list.push({ y: k.y, f: () => G.drawPickup(ctx, k, G.time) });
    for (const e of G.enemies) { if (e.dead && !(e.boss && G.bossDeath && !G.bossDeath.done)) continue; list.push({ y: e.spawning ? e.y - 100 : e.y + (e.fly ? 12 : 0), f: () => (e.boss ? B.draw(ctx, e, G.time) : E.draw(ctx, e, G.time)) }); }
    if (G.player) list.push({ y: G.player.y, f: () => Pl.draw(ctx, G.player, G.time) });
    list.sort((a, b) => a.y - b.y); for (const it of list) it.f();
    G.drawProjs(ctx, G.time); G.drawFx(ctx, G.time); G.drawTexts(ctx);
    ctx.restore();
    if (G.state !== 'menu') {
      ctx.drawImage(G.vig, 0, 0);
      const p = G.player; if (p && p.state !== 'dead' && p.hp / p.maxHp < 0.3) { ctx.globalAlpha = 0.25 + 0.2 * Math.sin(G.time * 6); ctx.drawImage(G.dangerVig, 0, 0); ctx.globalAlpha = 1; }
    } else { ctx.fillStyle = 'rgba(5,5,12,.55)'; ctx.fillRect(0, 0, W_, H_); }
    if (G.flashA > 0) { ctx.globalAlpha = Math.min(0.6, G.flashA); ctx.fillStyle = G.flashC; ctx.fillRect(0, 0, W_, H_); ctx.globalAlpha = 1; }
    if (G.fadeT) { ctx.globalAlpha = clamp(G.fadeT.a, 0, 1); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W_, H_); ctx.globalAlpha = 1; }
  }
  Game.frame = function (ts) {
    requestAnimationFrame(Game.frame);
    const raw = Math.min(0.05, Math.max(0, (ts - G.last) / 1000)); G.last = ts;
    try {
      if (G.state === 'play') { updatePlay(raw); if (PC.UI) PC.UI.updateHud(); }
      else if (G.state === 'menu') { G.time += raw; G.player.animT += raw; }
      else if (G.state === 'over' || G.state === 'win') { G.time += raw; G.updateWorldFx(raw); }
      draw();
    } catch (err) { console.error(err); G.lastError = String(err && err.stack || err); if (G.onError) G.onError(err); }
  };
  // Dipakai uji otomatis: maju N detik tanpa render
  Game.step = function (sec, hz) { const dt = 1 / (hz || 60); for (let t = 0; t < sec; t += dt) { if (G.state === 'play') updatePlay(dt); } };
})(window.PC);
