// Entitas inti: pemain, zona serangan (telegraf), proyektil, partikel, pickup, sistem damage.
window.PC = window.PC || {};
(function (PC) {
  const G = PC.G = PC.G || {};
  const U = PC.U, C = PC.C, W = PC.World, S = PC.S, In = PC.In;
  const { clamp, dist, angle, angDiff, rand, TAU } = U;

  // ================= Efek umum =================
  G.reset = function () {
    G.enemies = []; G.projs = []; G.zones = []; G.parts = []; G.texts = []; G.pickups = []; G.fx = []; G.rings = [];
    G.shake = 0; G.hitstop = 0; G.slow = { t: 0, scale: 1 }; G.flashA = 0; G.flashC = '#fff'; G.boss = null;
  };
  G.burst = function (x, y, n, col, spd, life, size, grav) {
    for (let i = 0; i < n && G.parts.length < 400; i++) {
      const a = Math.random() * TAU, s = rand(0.3, 1) * spd;
      G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.6, 1) * life, max: life, col: Array.isArray(col) ? U.choice(col) : col, size: size || 1, grav: grav || 0 });
    }
  };
  G.text = function (x, y, str, col, scale) { if (G.texts.length < 40) G.texts.push({ x: x + rand(-4, 4), y, vy: -26, life: 0.75, max: 0.75, str: String(str), col: col || '#fff', scale: scale || 1 }); };
  G.addShake = function (a) { G.shake = Math.max(G.shake, a); };
  G.stop = function (t) { G.hitstop = Math.max(G.hitstop, t); };
  G.slowmo = function (t, s) { G.slow.t = t; G.slow.scale = s; };
  G.flash = function (c, a) { G.flashC = c; G.flashA = a; };

  // ================= Zona (telegraf + serangan area) =================
  G.addZone = function (o) {
    const z = Object.assign({ shape: 'circle', t: 0, delay: 0.8, dur: 0.12, dmg: 0, tick: 999, tickT: 0, fired: false, color: '#ff3b3b', kb: 0, r: 20, range: 40, half: 0.8, len: 100, w: 20, a: 0 }, o);
    if (z.warn) z.dmg = 0; G.zones.push(z); return z;
  };
  function zoneHits(z, p) {
    const pr = 3.5;
    if (z.shape === 'circle') return dist(z.x, z.y, p.x, p.y) < z.r + pr;
    if (z.shape === 'cone') { const d = dist(z.x, z.y, p.x, p.y); return d < z.range + pr && Math.abs(angDiff(z.a, angle(z.x, z.y, p.x, p.y))) < z.half + Math.atan2(pr, Math.max(d, 1)); }
    const dx = p.x - z.x, dy = p.y - z.y, c = Math.cos(z.a), s = Math.sin(z.a), lx = dx * c + dy * s, ly = -dx * s + dy * c;
    return lx > -pr && lx < z.len + pr && Math.abs(ly) < z.w / 2 + pr;
  }
  function updateZones(dt) {
    const p = G.player;
    for (let i = G.zones.length - 1; i >= 0; i--) {
      const z = G.zones[i]; if (!z) continue; z.t += dt;
      if (z.follow) z.follow(z, dt);
      if (z.owner && z.owner.dead && z.cancel !== false) { G.zones.splice(i, 1); continue; }
      if (!z.fired && z.t >= z.delay) {
        z.fired = true; z.tickT = 0;
        if (!z.warn && z.sfx !== false) { if (z.big) { PC.Audio.play('slam'); G.addShake(z.big); } }
        if (!z.warn) { const cx = z.shape === 'rect' ? z.x + Math.cos(z.a) * z.len / 2 : z.x, cy = z.shape === 'rect' ? z.y + Math.sin(z.a) * z.len / 2 : z.y; G.burst(cx, cy, z.shape === 'circle' ? 14 : 8, [z.color, '#fff', '#ffb060'], 70, 0.45, 1); }
        if (z.onFire) z.onFire(z);
      }
      if (z.fired && z.dmg > 0) {
        if (z.sweep) z.a = U.lerp(z.sweep[0], z.sweep[1], clamp((z.t - z.delay) / z.dur, 0, 1));
        z.tickT -= dt;
        if (z.tickT <= 0) { z.tickT = z.tick; if (p.state !== 'dead' && zoneHits(z, p)) G.hurtPlayer(z.dmg, z.x, z.y, { kb: z.kb, noPerfect: z.tick < 900, shatter: z.shatter }); }
      }
      if (z.t >= z.delay + z.dur) { const ix = G.zones.indexOf(z); if (ix >= 0) G.zones.splice(ix, 1); }
    }
  }
  function drawZones(ctx, time) {
    for (const z of G.zones) {
      if (z.draw) { z.draw(ctx, z, time); continue; }
      const pre = z.t < z.delay, k = pre ? z.t / z.delay : 0, pulse = 0.5 + 0.5 * Math.sin(time * 18);
      ctx.save();
      const pathFor = (sc, a0, a1) => {
        ctx.beginPath();
        if (z.shape === 'circle') ctx.arc(Math.round(z.x), Math.round(z.y), Math.max(0.1, z.r * sc), 0, TAU);
        else if (z.shape === 'cone') { ctx.moveTo(z.x, z.y); ctx.arc(z.x, z.y, z.range * sc, a0 !== undefined ? a0 : z.a - z.half, a1 !== undefined ? a1 : z.a + z.half); ctx.closePath(); }
        else { ctx.translate(z.x, z.y); ctx.rotate(z.a); ctx.rect(0, -z.w / 2, z.len * sc, z.w); }
      };
      const col = z.color;
      if (pre) {
        let a0, a1; if (z.sweep && z.shape === 'cone') { a0 = Math.min(z.sweep[0], z.sweep[1]) - z.half; a1 = Math.max(z.sweep[0], z.sweep[1]) + z.half; }
        ctx.globalAlpha = 0.16 + 0.1 * pulse; ctx.fillStyle = col; pathFor(1, a0, a1); ctx.fill();
        ctx.setTransform(ctx.getTransform()); ctx.restore(); ctx.save();
        ctx.globalAlpha = 0.34; ctx.fillStyle = col; pathFor(k, a0, a1); ctx.fill(); ctx.restore(); ctx.save();
        ctx.globalAlpha = 0.85; ctx.strokeStyle = col; ctx.lineWidth = 1; pathFor(1, a0, a1); ctx.stroke();
      } else if (z.dmg > 0 || z.persist) {
        const tt = (z.t - z.delay), life = z.dur, fade = clamp(1 - tt / Math.max(life, 0.01), 0, 1);
        if (z.pool) { ctx.globalAlpha = 0.28 + 0.08 * Math.sin(time * 5 + z.x); ctx.fillStyle = z.pool; pathFor(1); ctx.fill(); ctx.restore(); ctx.save(); ctx.globalAlpha = 0.7; ctx.strokeStyle = z.pool; pathFor(1); ctx.stroke(); }
        else { ctx.globalAlpha = (z.dur > 0.5 ? 0.45 : 0.9) * (z.dur > 0.5 ? 1 : fade); ctx.fillStyle = z.dur > 0.5 ? '#ffb060' : '#fff'; pathFor(1); ctx.fill(); }
      }
      ctx.restore();
    }
  }

  // ================= Proyektil & cincin =================
  G.addProj = function (o) {
    const p = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, r: 3, dmg: 8, hostile: true, life: 3, col: '#ff5a5a', hit: null, pierce: 0, t: 0 }, o);
    if (o.speed !== undefined) { p.vx = Math.cos(o.a) * o.speed; p.vy = Math.sin(o.a) * o.speed; }
    G.projs.push(p); return p;
  };
  G.addRing = function (o) { const r = Object.assign({ r: 4, speed: 100, th: 5, dmg: 10, maxR: 260, hit: false, col: '#ffb060', t: 0 }, o); G.rings.push(r); return r; };
  function updateProjs(dt) {
    const p = G.player;
    for (let i = G.projs.length - 1; i >= 0; i--) {
      const q = G.projs[i]; if (!q) continue; q.t += dt; q.life -= dt;
      if (q.homing && p.state !== 'dead') { const da = angDiff(Math.atan2(q.vy, q.vx), angle(q.x, q.y, p.x, p.y)), sp = Math.hypot(q.vx, q.vy), na = Math.atan2(q.vy, q.vx) + clamp(da, -q.homing * dt, q.homing * dt); q.vx = Math.cos(na) * sp; q.vy = Math.sin(na) * sp; }
      q.x += q.vx * dt; q.y += q.vy * dt;
      let dead = q.life <= 0;
      if (!dead && W.solidAt(q.x, q.y)) { dead = true; G.burst(q.x, q.y, 5, q.col, 50, 0.3, 1); }
      if (!dead && q.hostile) {
        if (p.state !== 'dead' && dist(q.x, q.y, p.x, p.y) < q.r + 3.5) { G.hurtPlayer(q.dmg, q.x - q.vx, q.y - q.vy, { kb: 60 }); if (p.state !== 'dodge') dead = true; }
      } else if (!dead) {
        for (const e of G.enemies) {
          if (e.dead || e.untargetable || e.spawning || (q.hitSet && q.hitSet.has(e))) continue;
          if (dist(q.x, q.y, e.x, e.y) < q.r + e.r) {
            (q.hitSet = q.hitSet || new Set()).add(e);
            G.damageEnemy(e, q.dmg, { a: Math.atan2(q.vy, q.vx), kb: 60, fromPlayer: true, big: true });
            G.burst(q.x, q.y, 6, ['#5ee6ff', '#fff'], 70, 0.3, 1);
            if (q.pierce-- <= 0) { dead = true; break; }
          }
        }
      }
      if (dead) { if (q.onDie) q.onDie(q); const ix = G.projs.indexOf(q); if (ix >= 0) G.projs.splice(ix, 1); }
    }
    for (let i = G.rings.length - 1; i >= 0; i--) {
      const r = G.rings[i]; if (!r) continue; r.r += r.speed * dt; r.t += dt;
      if (!r.hit && p.state !== 'dead') { const d = dist(r.x, r.y, p.x, p.y); if (Math.abs(d - r.r) < r.th / 2 + 3) { r.hit = true; G.hurtPlayer(r.dmg, r.x, r.y, { kb: 90 }); } }
      if (r.r > r.maxR) { const ix = G.rings.indexOf(r); if (ix >= 0) G.rings.splice(ix, 1); }
    }
  }
  function drawProjs(ctx, time) {
    for (const q of G.projs) {
      const g = S.glow(q.col, q.r * 3 + 4);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55; ctx.drawImage(g, Math.round(q.x - g.width / 2), Math.round(q.y - g.height / 2)); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      if (q.bolt) { const a = Math.atan2(q.vy, q.vx); for (let k = 0; k < 7; k++) S.disc(ctx, q.x - Math.cos(a) * k * 2.2, q.y - Math.sin(a) * k * 2.2, Math.max(1, q.r - k * 0.5), k < 2 ? '#fff' : k < 4 ? '#5ee6ff' : '#2a7aff'); }
      else { S.disc(ctx, q.x, q.y, q.r, q.col); S.disc(ctx, q.x, q.y, Math.max(1, q.r - 2), '#fff'); }
    }
    for (const r of G.rings) {
      const n = Math.ceil(r.r * 1.6); ctx.fillStyle = r.col;
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU; const x = r.x + Math.cos(a) * r.r, y = r.y + Math.sin(a) * r.r; if (x < 8 || x > C.ROOM_W - 8 || y < 24 || y > C.ROOM_H - 10) continue; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); }
    }
  }

  // ================= Pickup =================
  G.drop = function (x, y, type, v) { G.pickups.push({ x, y, type, v: v || 0, vx: rand(-40, 40), vy: rand(-40, 40), t: 0 }); };
  function updatePickups(dt) {
    const p = G.player;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const k = G.pickups[i]; k.t += dt; k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= 0.9; k.vy *= 0.9;
      if (W.solidAt(k.x, k.y)) { k.x -= k.vx * dt; k.y -= k.vy * dt; k.vx = k.vy = 0; }
      const d = dist(k.x, k.y, p.x, p.y), mag = k.type === 'coin' ? 70 : 40;
      if (p.state !== 'dead' && k.t > 0.35 && d < mag) { const a = angle(k.x, k.y, p.x, p.y); k.x += Math.cos(a) * 170 * dt; k.y += Math.sin(a) * 170 * dt; }
      if (p.state !== 'dead' && d < 9) {
        if (k.type === 'coin') { G.run.gold += k.v; PC.Audio.play('coin'); }
        else if (k.type === 'heart') { p.hp = Math.min(p.maxHp, p.hp + 10); G.text(p.x, p.y - 12, '+10', '#ff6a6a'); PC.Audio.play('pickup'); }
        else if (k.type === 'orb') { p.mp = Math.min(p.maxMp, p.mp + 14); G.text(p.x, p.y - 12, '+MP', '#5ee6ff'); PC.Audio.play('pickup'); }
        else if (k.type === 'potion') { p.potions++; G.text(p.x, p.y - 12, '+RAMUAN', '#ff6a8a'); PC.Audio.play('pickup'); }
        G.pickups.splice(i, 1);
      }
    }
  }
  // ================= Pemain =================
  const SW = [
    { dur: 0.26, hit: 0.09, range: 30, half: 1.0, mul: 1.0, kb: 70, lunge: 12 },
    { dur: 0.26, hit: 0.09, range: 30, half: 1.0, mul: 1.0, kb: 70, lunge: 12 },
    { dur: 0.40, hit: 0.16, range: 37, half: 1.4, mul: 1.6, kb: 150, lunge: 20 },
  ];
  const SK = [{ mp: 20, cd: 5, name: 'Whirlwind' }, { mp: 14, cd: 3, name: 'Lance' }, { mp: 25, cd: 12, name: 'Aegis' }];
  const Player = {
    SK,
    create() {
      const f = PC.Save.data.forge, B = C.PLAYER;
      const p = {
        x: 40, y: C.ROOM_H / 2 + 10, r: 5, kvx: 0, kvy: 0,
        maxHp: B.hp + 10 * f.vit, maxMp: B.mp + 8 * f.foc, maxSt: B.st + 5 * f.agi,
        speed: B.speed * (1 + 0.03 * f.agi), dmgMul: 1 + 0.06 * f.pow, mpRegen: 2 * (1 + 0.1 * f.foc), stRegen: 34, dodgeCost: B.dodgeCost, iframes: B.iframes,
        atkSpeed: 1, crit: 0.08, critMul: 2, lifesteal: 0, mpPerHit: 3, whirlR: 38, lanceDmg: 26, lancePierce: 3, aegisHp: 40, aegisNova: 20,
        cdMul: [1, 1, 1], potions: 2 + f.alch, potionHeal: 38, perfectBonus: false, perfectBuff: 0, armor: 0,
        state: 'free', t: 0, face: 1, aimA: 0, invuln: 0, combo: 0, comboT: 0, cd: [0, 0, 0], potionCd: 0, stDelay: 0, shield: 0, shieldT: 0,
        dodgeDir: 0, dodgeT: 0, perfectDone: false, hurtT: 0, animT: 0, swing: null, hitDone: 0, moving: false, dead: false, stone: 0, stoneT: 0, stoning: 0, stoneNeed: 0.5, stoneImmune: 0,
      };
      p.hp = p.maxHp; p.mp = p.maxMp; p.st = p.maxSt; return p;
    },
    startRoom(p) { p.x = 40; p.y = C.ROOM_H / 2 + 10; p.kvx = p.kvy = 0; p.state = 'free'; p.invuln = 0.5; p.combo = 0; p.stone = 0; p.stoning = 0; p.stoneImmune = 0; },
    nearest(p, range) {
      let best = null, bd = 1e9;
      for (const e of G.enemies) { if (e.dead || e.untargetable || e.spawning) continue; const d = dist(p.x, p.y, e.x, e.y) - e.r; if (d < range && d < bd) { bd = d; best = e; } }
      return best;
    },
    aim(p, range) {
      const t = Player.nearest(p, range);
      if (t) return angle(p.x, p.y, t.x, t.y);
      if (Math.hypot(In.mx, In.my) > 0.2) return Math.atan2(In.my, In.mx);
      return p.face > 0 ? 0 : Math.PI;
    },
    calcDmg(p, base) {
      let d = base * p.dmgMul, crit = Math.random() < p.crit;
      if (p.perfectBuff > 0) { d *= 1.6; }
      if (crit) d *= p.critMul; return { d, crit };
    },
    sword(p, i) {
      const cfg = SW[i], a = p.aimA; let hits = 0;
      for (const e of G.enemies) {
        if (e.dead || e.untargetable || e.spawning || p.swing.hit.has(e)) continue;
        const d = dist(p.x, p.y, e.x, e.y); if (d - e.r > cfg.range) continue;
        if (Math.abs(angDiff(a, angle(p.x, p.y, e.x, e.y))) > cfg.half + Math.atan2(e.r, Math.max(d, 1))) continue;
        p.swing.hit.add(e);
        const { d: dmg, crit } = Player.calcDmg(p, 12 * cfg.mul);
        const done = G.damageEnemy(e, dmg, { a, kb: cfg.kb, crit, fromPlayer: true });
        if (done) { hits++; p.mp = Math.min(p.maxMp, p.mp + p.mpPerHit); if (p.lifesteal) p.hp = Math.min(p.maxHp, p.hp + p.lifesteal); G.stop(crit || i === 2 ? 0.07 : 0.04); G.addShake(crit || i === 2 ? 2.5 : 1.2); }
      }
      if (hits && p.perfectBuff > 0) p.perfectBuff = 0;
      G.fx.push({ type: 'slash', x: p.x, y: p.y, a, half: cfg.half, range: cfg.range, t: 0, life: 0.16, combo: i });
      PC.Audio.play(hits ? (i === 2 ? 'crit' : 'hit') : 'swing');
    },
    tryStartAttack(p) {
      p.aimA = Player.aim(p, 70); p.face = Math.cos(p.aimA) >= 0 ? 1 : -1;
      const i = p.comboT > 0 ? p.combo % 3 : 0; p.combo = i + 1; p.state = 'attack'; p.t = 0; p.swing = { i, hit: new Set(), fired: false };
      PC.Audio.play('swing');
    },
    useSkill(p, i) {
      const s = SK[i]; if (p.cd[i] > 0 || p.mp < s.mp) { if (p.mp < s.mp) G.text(p.x, p.y - 14, 'MP KURANG', '#6aa0ff'); return false; }
      p.mp -= s.mp; p.cd[i] = s.cd * p.cdMul[i]; p.t = 0; p.hitDone = 0;
      if (i === 0) { p.state = 'whirl'; p.swing = { pulse: 0, hit: new Set() }; PC.Audio.play('whirl'); }
      else if (i === 1) { p.state = 'cast'; p.aimA = Player.aim(p, 140); p.face = Math.cos(p.aimA) >= 0 ? 1 : -1; p.swing = { kind: 'lance', fired: false }; }
      else { p.state = 'cast'; p.swing = { kind: 'aegis', fired: false }; }
      return true;
    },
    breakShield(p, byHit) {
      p.shield = 0; p.shieldT = 0; PC.Audio.play('shieldBreak'); G.addShake(3);
      G.fx.push({ type: 'nova', x: p.x, y: p.y, t: 0, life: 0.3, r: 52 });
      for (const e of G.enemies) {
        if (e.dead || e.spawning) continue; const d = dist(p.x, p.y, e.x, e.y); if (d > 52 + e.r) continue;
        G.damageEnemy(e, p.aegisNova * p.dmgMul, { a: angle(p.x, p.y, e.x, e.y), kb: 160, fromPlayer: true });
        if (!e.boss && !e.armor) e.stun = Math.max(e.stun, 1.0);
      }
      G.burst(p.x, p.y, 20, ['#5ee6ff', '#fff'], 110, 0.5, 1);
    },
    usePotion(p) {
      if (p.potions <= 0) { G.text(p.x, p.y - 14, 'HABIS', '#aaa'); return; }
      if (p.hp >= p.maxHp || p.potionCd > 0) return;
      p.potions--; p.potionCd = 2.5; p.hp = Math.min(p.maxHp, p.hp + p.potionHeal); G.text(p.x, p.y - 14, '+' + p.potionHeal, '#6aff8a', 2); PC.Audio.play('potion');
      G.burst(p.x, p.y, 14, ['#6aff8a', '#fff'], 50, 0.6, 1, -30);
    },
    update(p, dt) {
      if (p.state === 'dead') return;
      p.t += dt; p.animT += dt; p.invuln = Math.max(0, p.invuln - dt); p.comboT = Math.max(0, p.comboT - dt); p.hurtT = Math.max(0, p.hurtT - dt);
      p.perfectBuff = Math.max(0, p.perfectBuff - dt); p.potionCd = Math.max(0, p.potionCd - dt);
      for (let i = 0; i < 3; i++) p.cd[i] = Math.max(0, p.cd[i] - dt);
      p.stDelay -= dt; if (p.stDelay <= 0) p.st = Math.min(p.maxSt, p.st + p.stRegen * dt);
      p.mp = Math.min(p.maxMp, p.mp + p.mpRegen * dt);
      if (p.shield > 0) { p.shieldT -= dt; if (p.shieldT <= 0) Player.breakShield(p, false); }
      if (p.kvx || p.kvy) { W.move(p, p.kvx * dt, p.kvy * dt); const f = Math.exp(-9 * dt); p.kvx *= f; p.kvy *= f; if (Math.abs(p.kvx) + Math.abs(p.kvy) < 4) p.kvx = p.kvy = 0; }
      // Status MEMBATU (Medusa): tidak bisa bergerak/aksi; tekan tombol apa pun untuk memperpendek
      p.stoneImmune = Math.max(0, p.stoneImmune - dt);
      if (p.stoning > 0 && p.state !== 'stone') p.stoning = Math.max(0, p.stoning - dt * 1.6);
      if (p.state === 'stone') { Player.updateStone(p, dt); return; }
      const mvLen = Math.hypot(In.mx, In.my);
      p.moving = mvLen > 0.2;
      // aksi yang bisa memotong state apa pun (kecuali dodge)
      if (p.state !== 'dodge') {
        if (In.buf.potion > 0) { In.consume('potion'); Player.usePotion(p); }
        if (In.buf.dodge > 0 && p.st >= p.dodgeCost * 0.999) {
          In.consume('dodge'); p.st -= p.dodgeCost; p.stDelay = 0.55; p.state = 'dodge'; p.t = 0; p.perfectDone = false;
          p.dodgeDir = p.moving ? Math.atan2(In.my, In.mx) : (p.face > 0 ? Math.PI : 0); if (!p.moving && Player.nearest(p, 60)) p.dodgeDir = Player.aim(p, 60) + Math.PI;
          p.invuln = Math.max(p.invuln, p.iframes); p.face = Math.cos(p.dodgeDir) >= 0 ? 1 : -1; PC.Audio.play('dodge'); In.vibrate(10);
          G.burst(p.x, p.y + 4, 6, '#9aa0c0', 40, 0.3, 1);
        } else if (In.buf.dodge > 0 && p.st < p.dodgeCost) { if (In.consume('dodge')) G.text(p.x, p.y - 14, 'STAMINA', '#6aff8a'); }
      }
      const canAct = p.state === 'free' || (p.state === 'attack' && p.swing.fired && p.t > SW[p.swing.i].hit + 0.04);
      if (p.state === 'free' || canAct) {
        for (let i = 0; i < 3; i++) if (In.buf['s' + i] > 0) { In.consume('s' + i); if (Player.useSkill(p, i)) break; }
      }
      switch (p.state) {
        case 'free': {
          const sp = p.speed * (p.shield > 0 ? 0.95 : 1);
          if (p.moving) { W.move(p, In.mx * sp * dt, In.my * sp * dt); if (Math.abs(In.mx) > 0.15) p.face = In.mx > 0 ? 1 : -1; }
          if (In.buf.attack > 0 || In.held.attack) { In.consume('attack'); Player.tryStartAttack(p); }
          break;
        }
        case 'attack': {
          const cfg = SW[p.swing.i], dur = cfg.dur / p.atkSpeed, hitT = cfg.hit / p.atkSpeed;
          const k = p.t < hitT ? (1 - p.t / hitT) : 0; if (k > 0 || p.t < hitT + 0.05) W.move(p, Math.cos(p.aimA) * cfg.lunge * (1 / hitT) * dt * k * 1.4, Math.sin(p.aimA) * cfg.lunge * (1 / hitT) * dt * k * 1.4);
          if (!p.swing.fired && p.t >= hitT) { p.swing.fired = true; Player.sword(p, p.swing.i); }
          if (p.t >= dur) { p.state = 'free'; p.comboT = 0.32; if (p.swing.i === 2) p.comboT = 0; if (In.buf.attack > 0 || In.held.attack) { In.consume('attack'); Player.tryStartAttack(p); } }
          break;
        }
        case 'dodge': {
          const B = C.PLAYER, dur = B.dodgeDur;
          W.move(p, Math.cos(p.dodgeDir) * B.dodgeSpeed * dt * (1 - p.t / dur * 0.5) * 1.3, Math.sin(p.dodgeDir) * B.dodgeSpeed * dt * (1 - p.t / dur * 0.5) * 1.3);
          if (Math.floor(p.t * 60) % 2 === 0) G.fx.push({ type: 'ghost', x: p.x, y: p.y, face: p.face, t: 0, life: 0.22 });
          if (p.t >= dur) { p.state = 'free'; p.comboT = 0; }
          break;
        }
        case 'whirl': {
          const sp = p.speed * 0.45; if (p.moving) W.move(p, In.mx * sp * dt, In.my * sp * dt);
          const pulses = [0.1, 0.27, 0.44];
          while (p.swing.pulse < 3 && p.t >= pulses[p.swing.pulse]) {
            p.swing.pulse++; let hits = 0;
            for (const e of G.enemies) {
              if (e.dead || e.untargetable || e.spawning) continue; const d = dist(p.x, p.y, e.x, e.y); if (d - e.r > p.whirlR) continue;
              const { d: dmg, crit } = Player.calcDmg(p, 11); if (G.damageEnemy(e, dmg, { a: angle(p.x, p.y, e.x, e.y), kb: 90, crit, fromPlayer: true })) { hits++; p.mp = Math.min(p.maxMp, p.mp + 1); }
            }
            if (hits) { G.stop(0.03); G.addShake(1.5); PC.Audio.play('hit'); }
            // tebas peluru kecil
            for (let i = G.projs.length - 1; i >= 0; i--) { const q = G.projs[i]; if (q.hostile && !q.noReflect && dist(q.x, q.y, p.x, p.y) < p.whirlR) { G.burst(q.x, q.y, 4, q.col, 40, 0.25, 1); G.projs.splice(i, 1); } }
          }
          if (p.t >= 0.55) { p.state = 'free'; if (p.perfectBuff > 0 && p.swing.pulse) p.perfectBuff = 0; }
          break;
        }
        case 'cast': {
          const sp = p.speed * 0.35; if (p.moving) W.move(p, In.mx * sp * dt, In.my * sp * dt);
          if (!p.swing.fired && p.t >= 0.08) {
            p.swing.fired = true;
            if (p.swing.kind === 'lance') {
              const { d: dmg } = Player.calcDmg(p, p.lanceDmg); PC.Audio.play('lance');
              G.addProj({ x: p.x + Math.cos(p.aimA) * 8, y: p.y - 2 + Math.sin(p.aimA) * 8, a: p.aimA, speed: 270, r: 3, dmg, hostile: false, life: 0.9, col: '#5ee6ff', pierce: p.lancePierce, bolt: true });
              p.kvx -= Math.cos(p.aimA) * 40; p.kvy -= Math.sin(p.aimA) * 40; G.addShake(1);
            } else { p.shield = p.aegisHp; p.shieldT = 6; PC.Audio.play('aegis'); G.burst(p.x, p.y, 14, ['#5ee6ff', '#fff'], 60, 0.5, 1); }
          }
          if (p.t >= 0.2) p.state = 'free';
          break;
        }
      }
      p.x = clamp(p.x, 18, C.ROOM_W - 18 + (W.room.doorOpen ? 14 : 0));
    },
    // Dipanggil boss tiap frame saat pemain berada di dalam tatapan. Kembali true bila pemain baru membatu.
    gazeHit(dt, need) {
      const p = G.player; if (p.state === 'dead' || p.state === 'stone' || G.cutscene || G.godmode || p.stoneImmune > 0 || p.invuln > 0) return false;
      p.stoning += dt * 2.6; p.stoneNeed = need; if (p.stoning < need) return false; p.stoning = 0;
      if (p.shield > 0) { Player.breakShield(p, true); p.stoneImmune = 1.0; G.text(p.x, p.y - 16, 'AEGIS!', '#5ee6ff', 2); return false; }
      Player.petrify(p, 1.5); return true;
    },
    petrify(p, dur) {
      p.state = 'stone'; p.stone = p.stoneT = dur; p.swing = null; p.combo = 0; p.kvx = p.kvy = 0; p.invuln = 0;
      G.text(p.x, p.y - 16, 'MEMBATU!', '#c8ccd8', 2); PC.Audio.play('shieldBreak'); G.addShake(3); G.flash('#c8ccd8', 0.35); In.vibrate(40);
      G.burst(p.x, p.y - 4, 14, ['#9aa0b0', '#d8dce8', '#6a7088'], 70, 0.5, 1);
    },
    releaseStone(p, msg) {
      p.state = 'free'; p.stone = 0; p.stoning = 0; p.stoneImmune = 1.5; p.invuln = Math.max(p.invuln, 0.35); p.comboT = 0;
      G.text(p.x, p.y - 16, msg || 'BEBAS!', '#6aff8a', 2); G.burst(p.x, p.y - 4, 16, ['#9aa0b0', '#d8dce8', '#fff'], 90, 0.5, 1); PC.Audio.play('perfect');
    },
    updateStone(p, dt) {
      p.stone -= dt;
      for (const k of ['attack', 'dodge', 'potion', 's0', 's1', 's2']) if (In.consume(k)) { p.stone -= 0.2; G.burst(p.x, p.y - 4, 3, ['#9aa0b0', '#d8dce8'], 45, 0.25, 1); PC.Audio.play('click'); }
      if (p.stone <= 0) Player.releaseStone(p);
    },
    hurt(dmg, sx, sy, o) {
      const p = G.player; o = o || {};
      if (p.state === 'dead' || G.cutscene || G.godmode) return false;
      if (p.invuln > 0) {
        if (p.state === 'dodge' && !p.perfectDone && !o.noPerfect) {
          p.perfectDone = true; G.slowmo(0.42, 0.35); G.text(p.x, p.y - 16, 'PERFECT!', '#5ee6ff', 2); PC.Audio.play('perfect');
          p.mp = Math.min(p.maxMp, p.mp + (p.perfectBonus ? 35 : 15)); p.st = Math.min(p.maxSt, p.st + 25); if (p.perfectBonus) p.perfectBuff = 4;
          G.flash('#5ee6ff', 0.25); G.burst(p.x, p.y, 12, ['#5ee6ff', '#fff'], 80, 0.4, 1); G.run.perfects++;
        }
        return false;
      }
      dmg = Math.max(1, Math.round(dmg * C.PLAYER.dmgTaken)); if (p.state === 'stone' && !o.shatter) dmg = Math.max(1, Math.round(dmg * 0.5));
      if (p.shield > 0) {
        const ab = Math.min(p.shield, dmg); p.shield -= ab; dmg -= ab; G.text(p.x, p.y - 14, 'BLOCK', '#7df'); p.invuln = 0.3; PC.Audio.play('hit'); G.burst(p.x, p.y, 6, '#5ee6ff', 60, 0.3, 1);
        if (p.shield <= 0) Player.breakShield(p, true); if (dmg <= 0) return true;
      }
      p.hp -= dmg; p.invuln = C.PLAYER.hurtIframes; p.hurtT = 0.25; G.run.damageTaken += dmg;
      const a = angle(sx, sy, p.x, p.y), kb = o.kb === undefined ? 70 : o.kb; p.kvx += Math.cos(a) * kb; p.kvy += Math.sin(a) * kb;
      G.stop(0.07); G.addShake(4); G.flash('#ff2020', 0.35); PC.Audio.play('hurt'); In.vibrate(45); G.text(p.x, p.y - 14, '-' + dmg, '#ff5a5a', 2);
      G.burst(p.x, p.y, 10, ['#ff4a4a', '#8f2433'], 70, 0.4, 1);
      if (p.state === 'stone' && o.shatter && p.hp > 0) Player.releaseStone(p, 'PECAH!');
      if (p.hp <= 0) { p.hp = 0; p.state = 'dead'; p.dead = true; if (G.onPlayerDeath) G.onPlayerDeath(); }
      return true;
    },
    draw(ctx, p, time) {
      const run = p.moving && p.state !== 'attack' && p.state !== 'dodge';
      const frames = run ? S.hero.run : S.hero.idle, spr = frames[Math.floor(p.animT * (run ? 10 : 3)) % frames.length];
      if (p.state === 'dead') { ctx.globalAlpha = 0.9; ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y)); ctx.rotate(Math.PI / 2 * (p.face > 0 ? 1 : -1)); S.draw(ctx, spr, 0, 0, false, false); ctx.restore(); ctx.globalAlpha = 1; return; }
      const blink = p.invuln > 0 && p.state !== 'dodge' && Math.floor(time * 20) % 2 === 0 && p.hurtT <= 0;
      if (blink) ctx.globalAlpha = 0.45;
      if (p.state === 'dodge') {
        const q = Math.min(3, Math.floor(p.t / C.PLAYER.dodgeDur * 4)); ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y - 5)); ctx.rotate(q * Math.PI / 2 * p.face); S.draw(ctx, spr, 0, 5, p.face < 0, false); ctx.restore();
      } else S.draw(ctx, spr, p.x, p.y, p.face < 0, p.hurtT > 0.1);
      ctx.globalAlpha = 1;
      if (p.state === 'stone' || p.stoning > 0.03) { // efek batu: warna abu-abu + bilah progres
        const st = p.state === 'stone', k = st ? 1 : clamp(p.stoning / (p.stoneNeed || 0.5), 0, 1);
        ctx.globalAlpha = 0.8 * k; S.draw(ctx, S.tint(spr, '#aab0c4'), p.x, p.y, p.face < 0, false); ctx.globalAlpha = 1;
        const bx = Math.round(p.x) - 8, by = Math.round(p.y) - 24; ctx.fillStyle = '#14101f'; ctx.fillRect(bx - 1, by - 1, 18, 4); ctx.fillStyle = st ? '#ffe066' : '#c8ccd8'; ctx.fillRect(bx, by, Math.round(16 * (st ? clamp(p.stone / p.stoneT, 0, 1) : k)), 2);
        if (st && Math.floor(time * 8) % 2 === 0) S.text(ctx, 'TEKAN!', p.x, p.y - 34, '#ffffff', 1, 'center');
      }
      if (p.state === 'attack' && p.swing) { // bilah terayun
        const cfg = SW[p.swing.i], dur = cfg.dur / p.atkSpeed, k = clamp(p.t / dur, 0, 1), a = p.aimA - cfg.half + 2 * cfg.half * k;
        S.pxLine(ctx, p.x + Math.cos(a) * 6, p.y - 4 + Math.sin(a) * 6, p.x + Math.cos(a) * (cfg.range - 4), p.y - 4 + Math.sin(a) * (cfg.range - 4), '#eef3ff');
      }
      if (p.shield > 0) {
        const fl = p.shieldT < 1.5 && Math.floor(time * 12) % 2 === 0; if (!fl) { ctx.globalAlpha = 0.5; ctx.strokeStyle = '#5ee6ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Math.round(p.x), Math.round(p.y - 5), 12, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(94,230,255,.15)'; ctx.fill(); ctx.globalAlpha = 1; }
      }
    },
  };
  PC.Player = Player;

  // ================= Efek fx =================
  function updateFx(dt) {
    for (let i = G.fx.length - 1; i >= 0; i--) { const f = G.fx[i]; f.t += dt; if (f.t >= f.life) G.fx.splice(i, 1); }
    for (let i = G.parts.length - 1; i >= 0; i--) { const q = G.parts[i]; q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.grav * dt; q.vx *= 0.96; q.vy *= 0.96; if (q.life <= 0) G.parts.splice(i, 1); }
    for (let i = G.texts.length - 1; i >= 0; i--) { const t = G.texts[i]; t.life -= dt; t.y += t.vy * dt; t.vy *= 0.94; if (t.life <= 0) G.texts.splice(i, 1); }
  }
  function drawFx(ctx, time) {
    for (const f of G.fx) {
      const k = f.t / f.life;
      if (f.type === 'slash') {
        const col = f.combo === 2 ? ['#ffe066', '#ff8a2a', '#fff'] : ['#ffffff', '#cfe6ff', '#8ab4ff'];
        const reach = Math.min(1, k * 2.2 + 0.25), a0 = f.a - f.half, a1 = a0 + 2 * f.half * reach, th = f.combo === 2 ? 5 : 3;
        for (let a = a0; a < a1; a += 0.035) for (let j = 0; j < th; j++) { ctx.fillStyle = col[Math.min(2, j + (k > 0.6 ? 1 : 0)) % 3]; ctx.globalAlpha = 1 - k * 0.8; ctx.fillRect(Math.round(f.x + Math.cos(a) * (f.range - j)), Math.round(f.y - 4 + Math.sin(a) * (f.range - j)), 1, 1); }
        ctx.globalAlpha = 1;
      } else if (f.type === 'ghost') {
        ctx.globalAlpha = 0.35 * (1 - k); S.draw(ctx, S.hero.idle[0], f.x, f.y, f.face < 0, true); ctx.globalAlpha = 1;
      } else if (f.type === 'nova') {
        const r = f.r * Math.min(1, k * 2); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#5ee6ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Math.round(f.x), Math.round(f.y), r, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      } else if (f.type === 'ringfx') {
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = f.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(Math.round(f.x), Math.round(f.y), f.r * k, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
    const p = G.player;
    if (p && p.state === 'whirl') { const R = p.whirlR, base = p.t * 24; ctx.fillStyle = '#cfe6ff'; for (let s = 0; s < 3; s++) for (let a = 0; a < 1.3; a += 0.04) { const an = base + s * 2.09 + a; for (let j = 0; j < 3; j++) { ctx.globalAlpha = a / 1.3; ctx.fillRect(Math.round(p.x + Math.cos(an) * (R - j)), Math.round(p.y - 4 + Math.sin(an) * (R - j)), 1, 1); } } ctx.globalAlpha = 1; }
    for (const q of G.parts) { ctx.globalAlpha = clamp(q.life / q.max * 1.5, 0, 1); ctx.fillStyle = q.col; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size); }
    ctx.globalAlpha = 1;
  }
  function drawTexts(ctx) { for (const t of G.texts) { ctx.globalAlpha = clamp(t.life / t.max * 2, 0, 1); S.text(ctx, t.str, t.x, t.y, t.col, t.scale, 'center'); } ctx.globalAlpha = 1; }

  // ================= Damage ke musuh =================
  G.damageEnemy = function (e, dmg, o) {
    o = o || {};
    if (e.dead || e.untargetable || e.spawning) return 0;
    if (e.invuln) { G.text(e.x, e.y - e.r - 6, 'KEBAL', '#aaa'); G.burst(e.x, e.y, 3, '#aaa', 40, 0.2, 1); return 0; }
    if (e.guard && e.guard(e, o)) { dmg *= 0.35; G.text(e.x, e.y - e.r - 12, 'CLANG', '#9aa6c8'); PC.Audio.play('hit'); }
    if (e.vulnMul) dmg *= e.vulnMul;
    dmg = Math.max(1, Math.round(dmg)); e.hp -= dmg; e.flash = 0.09; e.hurtT = 0.2;
    G.text(e.x, e.y - e.r - 6, dmg, o.crit ? '#ffe066' : '#ffffff', o.crit ? 2 : 1);
    G.burst(e.x, e.y, o.crit ? 9 : 5, e.blood || ['#ffffff', '#ffb060'], 60, 0.3, 1);
    if (!e.boss && !e.armor && o.kb) { e.kvx += Math.cos(o.a) * o.kb; e.kvy += Math.sin(o.a) * o.kb; e.stun = Math.max(e.stun, 0.22); }
    if (e.hp <= 0) G.killEnemy(e);
    return dmg;
  };
  G.killEnemy = function (e) {
    if (e.dead) return; e.dead = true; e.hp = 0; G.run.kills++; PC.Save.data.kills++;
    PC.Audio.play(e.boss ? 'explode' : 'kill'); G.burst(e.x, e.y, e.boss ? 40 : 14, e.blood || ['#ffffff', '#ffb060'], e.boss ? 140 : 80, 0.6, 2);
    if (e.boss) { if (e.onDeath) e.onDeath(e); return; }
    const d = C.ENEMY[e.type]; const n = Math.max(1, Math.round(d.gold / 2.5 * (e.elite ? 2 : 1)));
    for (let i = 0; i < n; i++) G.drop(e.x, e.y, 'coin', 2);
    if (Math.random() < 0.24) G.drop(e.x, e.y, 'orb'); if (Math.random() < 0.06) G.drop(e.x, e.y, 'heart'); if (e.elite) G.drop(e.x, e.y, 'potion');
  };

  G.hurtPlayer = Player.hurt;
  G.updateWorldFx = function (dt) { updateZones(dt); updateProjs(dt); updatePickups(dt); updateFx(dt); };
  G.drawZones = drawZones; G.drawProjs = drawProjs; G.drawFx = drawFx; G.drawTexts = drawTexts;
  G.drawPickup = function (ctx, k, time) { const bob = Math.sin(time * 6 + k.x) * 1.5; const spr = k.type === 'coin' ? S.coin[Math.floor(time * 6 + k.x) % 2] : k.type === 'heart' ? S.heart : k.type === 'orb' ? S.orb : S.potion; S.draw(ctx, spr, k.x, k.y + bob); };
})(window.PC);
