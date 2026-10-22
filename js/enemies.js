// Musuh biasa: AI berbasis generator (urutan serangan terbaca & telegraf jelas).
window.PC = window.PC || {};
(function (PC) {
  const G = PC.G, U = PC.U, C = PC.C, W = PC.World, S = PC.S;
  const { dist, angle, rand, wait, during, TAU } = U;
  const P = () => G.player;
  const faceP = e => { e.face = P().x < e.x ? -1 : 1; };
  const toward = (e, x, y, sp) => { const a = angle(e.x, e.y, x, y); e.mx = Math.cos(a) * sp; e.my = Math.sin(a) * sp; };
  const away = (e, x, y, sp) => { const a = angle(x, y, e.x, e.y); e.mx = Math.cos(a) * sp; e.my = Math.sin(a) * sp; };
  const strafe = (e, x, y, sp, dir) => { const a = angle(e.x, e.y, x, y) + dir * Math.PI / 2; e.mx = Math.cos(a) * sp; e.my = Math.sin(a) * sp; };
  const trackZone = (e, until) => (z) => { if (z.t < until) { z.x = e.x; z.y = e.y; z.a = angle(e.x, e.y, P().x, P().y); } };

  const BRAINS = {
    *slime(e) {
      yield* wait(rand(0.2, 0.9));
      for (;;) {
        faceP(e); e.pose = 1; e.armor = true; yield* wait(0.4);
        const a = angle(e.x, e.y, P().x, P().y) + rand(-0.35, 0.35); e.pose = 2; e.contactDmg = e.dmg;
        yield* during(0.42, (dt, k) => { const sp = 105 * (1 - k * 0.35); e.mx = Math.cos(a) * sp; e.my = Math.sin(a) * sp; e.z = Math.sin(k * Math.PI) * 9; e.face = Math.cos(a) < 0 ? -1 : 1; });
        e.z = 0; e.contactDmg = 0; e.pose = 0; e.armor = false; yield* wait(rand(0.55, 1.0));
      }
    },
    *skeleton(e) {
      yield* wait(rand(0.2, 0.8));
      for (;;) {
        yield* during(3.5, () => { faceP(e); if (dist(e.x, e.y, P().x, P().y) < 27) return false; toward(e, P().x, P().y, e.speed); });
        faceP(e); e.armor = true; e.pose = 'wind'; const a = angle(e.x, e.y, P().x, P().y);
        G.addZone({ shape: 'cone', x: e.x, y: e.y, a, half: 0.9, range: 31, delay: 0.55, dur: 0.12, dmg: e.dmg, kb: 90, owner: e, follow: trackZone(e, 0.3) });
        yield* wait(0.55); PC.Audio.play('swing'); e.pose = 0; yield* wait(0.2);
        e.armor = false; yield* wait(rand(0.7, 1.1));
      }
    },
    *archer(e) {
      yield* wait(rand(0.3, 1.0)); let dir = Math.random() < 0.5 ? 1 : -1;
      for (;;) {
        yield* during(rand(0.9, 1.6), () => { faceP(e); const d = dist(e.x, e.y, P().x, P().y); if (d < 85) away(e, P().x, P().y, e.speed * 1.3); else if (d > 135) toward(e, P().x, P().y, e.speed); else strafe(e, P().x, P().y, e.speed * 0.8, dir); });
        dir = -dir; faceP(e); e.armor = true;
        const z = G.addZone({ shape: 'rect', x: e.x, y: e.y, a: angle(e.x, e.y, P().x, P().y), len: 220, w: 4, delay: 0.75, dur: 0.05, warn: true, color: '#ff9a3b', owner: e, follow: trackZone(e, 0.5) });
        yield* wait(0.75); PC.Audio.play('fire');
        G.addProj({ x: e.x, y: e.y - 4, a: z.a, speed: 180, r: 2.5, dmg: e.dmg, col: '#e8e0cc', life: 2.5 });
        yield* wait(0.25); e.armor = false; yield* wait(rand(0.8, 1.3));
      }
    },
    *bat(e) {
      yield* wait(rand(0, 0.6)); let orb = rand(0, TAU), dir = Math.random() < 0.5 ? 1 : -1;
      for (;;) {
        yield* during(rand(1.0, 1.9), (dt) => { orb += dt * 2.2 * dir; toward(e, P().x + Math.cos(orb) * 62, P().y + Math.sin(orb) * 50, e.speed); faceP(e); });
        e.armor = true; e.pose = 1; yield* during(0.38, () => { faceP(e); e.mx = rand(-12, 12); e.my = rand(-12, 12); });
        const a = angle(e.x, e.y, P().x, P().y); e.contactDmg = e.dmg; PC.Audio.play('swing');
        yield* during(0.5, () => { e.mx = Math.cos(a) * 200; e.my = Math.sin(a) * 200; e.face = Math.cos(a) < 0 ? -1 : 1; if (e.blocked) return false; });
        e.contactDmg = 0; e.pose = 0; e.armor = false; dir = -dir; yield* wait(0.35);
      }
    },
    *ghoul(e) {
      yield* wait(rand(0.3, 0.9));
      for (;;) {
        yield* during(rand(1.2, 2.2), () => { faceP(e); if (dist(e.x, e.y, P().x, P().y) < 105) return false; toward(e, P().x, P().y, e.speed); });
        faceP(e); e.armor = true; e.pose = 1;
        const z = G.addZone({ shape: 'rect', x: e.x, y: e.y, a: angle(e.x, e.y, P().x, P().y), len: 200, w: 18, delay: 0.75, dur: 0.05, warn: true, owner: e, follow: trackZone(e, 0.5) });
        yield* wait(0.75); const a = z.a; e.contactDmg = e.dmg; PC.Audio.play('roar');
        yield* during(0.6, () => { e.mx = Math.cos(a) * 255; e.my = Math.sin(a) * 255; e.face = Math.cos(a) < 0 ? -1 : 1; if (e.blocked) { G.addShake(3); return false; } });
        e.contactDmg = 0; e.pose = 0; e.armor = false; e.vulnMul = 1.35; yield* wait(1.2); e.vulnMul = 1; // lelah: celah menyerang
      }
    },
    *mage(e) {
      yield* wait(rand(0.4, 1.0)); const n = G.run && G.run.floor >= 2 ? 5 : 3;
      for (;;) {
        yield* during(rand(0.8, 1.4), () => { faceP(e); const d = dist(e.x, e.y, P().x, P().y); if (d < 90) away(e, P().x, P().y, e.speed * 1.2); else if (d > 150) toward(e, P().x, P().y, e.speed); });
        faceP(e); e.pose = 'cast'; e.armor = true; const a = angle(e.x, e.y, P().x, P().y), spread = 0.5;
        const z = G.addZone({ shape: 'cone', x: e.x, y: e.y - 4, a, half: spread / 2 + 0.05, range: 130, delay: 0.7, dur: 0.05, warn: true, color: '#b58cff', owner: e, follow: trackZone(e, 0.45) });
        yield* wait(0.7); PC.Audio.play('fire');
        for (let i = 0; i < n; i++) G.addProj({ x: e.x, y: e.y - 4, a: z.a - spread / 2 + (n === 1 ? spread / 2 : spread * i / (n - 1)), speed: 108, r: 3, dmg: e.dmg, col: '#b58cff', life: 3 });
        yield* wait(0.35); e.pose = 0; e.armor = false;
        yield* during(0.22, (dt, k) => { e.alpha = 1 - k; }); e.untargetable = true;
        const pos = W.randomFree(e.r, P(), 75); G.burst(e.x, e.y, 10, '#b58cff', 60, 0.4, 1); e.x = pos.x; e.y = pos.y;
        yield* during(0.22, (dt, k) => { e.alpha = k; }); e.alpha = 1; e.untargetable = false; G.burst(e.x, e.y, 10, '#b58cff', 60, 0.4, 1);
        yield* wait(rand(0.5, 1.0));
      }
    },
    *knight(e) {
      yield* wait(rand(0.3, 0.8));
      for (;;) {
        yield* during(4, () => { faceP(e); if (dist(e.x, e.y, P().x, P().y) < 32) return false; toward(e, P().x, P().y, e.speed); });
        faceP(e); e.pose = 'wind'; const a = angle(e.x, e.y, P().x, P().y);
        G.addZone({ shape: 'cone', x: e.x, y: e.y, a, half: 1.0, range: 42, delay: 0.9, dur: 0.12, dmg: e.dmg, kb: 150, big: 2, owner: e, follow: trackZone(e, 0.5) });
        yield* wait(0.9); e.pose = 0; yield* wait(0.2);
        e.exposed = true; yield* wait(1.3); e.exposed = false; // terbuka: damage penuh
      }
    },
    *imp(e) {
      yield* wait(rand(0.3, 1.0)); let dir = 1;
      for (;;) {
        yield* during(rand(0.8, 1.4), () => { faceP(e); const d = dist(e.x, e.y, P().x, P().y); if (d < 80) away(e, P().x, P().y, e.speed * 1.3); else if (d > 135) toward(e, P().x, P().y, e.speed); else strafe(e, P().x, P().y, e.speed, dir); });
        dir = -dir; const tx = P().x + (In_mx() * 18), ty = P().y + (In_my() * 18);
        e.armor = true; e.pose = 1; PC.Audio.play('telegraph');
        G.addZone({ shape: 'circle', x: tx, y: ty, r: 28, delay: 1.1, dur: 0.14, dmg: e.dmg, kb: 120, big: 2, color: '#ff8a2a', owner: e });
        yield* wait(0.6); e.pose = 0; e.armor = false; yield* wait(rand(0.8, 1.2));
      }
    },
  };
  const In_mx = () => PC.In.mx, In_my = () => PC.In.my;

  const E = PC.Enemies = {
    spawn(type, x, y, opts) {
      opts = opts || {}; const d = C.ENEMY[type], fl = G.run ? G.run.floor : 0, el = !!opts.elite, hpMul = (1 + 0.22 * fl) * (el ? 2.2 : 1);
      const e = {
        type, boss: false, x, y, r: d.r + (el ? 1 : 0), hp: d.hp * hpMul, maxHp: d.hp * hpMul, speed: d.speed, dmg: d.dmg * (1 + 0.1 * fl) * (el ? 1.25 : 1), fly: !!d.fly, elite: el,
        face: 1, mx: 0, my: 0, kvx: 0, kvy: 0, stun: 0, flash: 0, hurtT: 0, t: 0, pose: 0, z: 0, alpha: 1, armor: type === 'knight', contactDmg: 0, dead: false, blocked: false,
        spawning: true, spawnT: 0, vulnMul: 1, exposed: false, solid: type === 'knight' || type === 'ghoul', untargetable: false, shown: false,
      };
      if (type === 'knight') e.guard = (en) => !en.exposed;
      e.gen = BRAINS[type](e); W.unstick(e); G.enemies.push(e); PC.Audio.play('spawn'); return e;
    },
    update(e, dt) {
      if (e.spawning) { e.spawnT += dt; if (e.spawnT >= 0.9) { e.spawning = false; G.burst(e.x, e.y, 10, '#b58cff', 60, 0.4, 1); } return; }
      e.t += dt; e.flash = Math.max(0, e.flash - dt); e.hurtT = Math.max(0, e.hurtT - dt);
      if (e.kvx || e.kvy) { W.move(e, e.kvx * dt, e.kvy * dt); const f = Math.exp(-8 * dt); e.kvx *= f; e.kvy *= f; if (Math.abs(e.kvx) + Math.abs(e.kvy) < 4) e.kvx = e.kvy = 0; }
      if (e.boss && PC.Bosses.checkPhase) PC.Bosses.checkPhase(e);
      if (e.stun > 0) { e.stun -= dt; e.blocked = false; return; }
      e.mx = 0; e.my = 0;
      if (e.gen) { const r = e.gen.next(dt); if (r.done) e.gen = null; }
      e.blocked = false;
      if (e.mx || e.my) {
        const res = W.move(e, e.mx * dt, e.my * dt); e.blocked = res.x || res.y;
        // Tanpa pathfinding: bila terhalang pilar, geser menyamping agar tidak macet di belakang rintangan
        if (e.blocked && !e.fly && !(e.contactDmg > 0)) {
          if (e.side === undefined) e.side = Math.random() < 0.5 ? 1 : -1;
          const sp = Math.hypot(e.mx, e.my) * dt;
          if (res.x && !res.y) { if (W.move(e, 0, e.side * sp).y) e.side = -e.side; }
          else if (res.y && !res.x) { if (W.move(e, e.side * sp, 0).x) e.side = -e.side; }
          else if (res.x && res.y) e.side = -e.side;
        }
      }
      const p = P();
      if (p.state !== 'dead') {
        const d = dist(e.x, e.y, p.x, p.y);
        if (e.contactDmg > 0 && d < e.r + 4) G.hurtPlayer(e.contactDmg, e.x, e.y, { kb: 100 });
        if (e.solid && !e.untargetable && d < e.r + p.r) { const a = angle(e.x, e.y, p.x, p.y), push = e.r + p.r - d; W.move(p, Math.cos(a) * push, Math.sin(a) * push); }
      }
      e.x = U.clamp(e.x, 20, C.ROOM_W - 20); e.y = U.clamp(e.y, 36, C.ROOM_H - 20);
    },
    draw(ctx, e, time) {
      if (e.spawning) { E.drawSpawn(ctx, e, time); return; }
      const f = Math.floor(e.t * (e.mx || e.my ? 8 : 3)) % 2;
      let spr;
      switch (e.type) {
        case 'slime': spr = S.slime[e.pose]; break;
        case 'skeleton': spr = e.pose === 'wind' ? S.skeleton.wind : S.skeleton.f[f]; break;
        case 'archer': spr = S.archer.f[f]; break;
        case 'bat': spr = S.bat[Math.floor(e.t * (e.pose ? 16 : 11)) % 2]; break;
        case 'ghoul': spr = e.pose === 1 ? S.ghoul.wind : S.ghoul.f[f]; break;
        case 'mage': spr = e.pose === 'cast' ? S.mage.cast : S.mage.f[f]; break;
        case 'knight': spr = e.pose === 'wind' ? S.knight.wind : S.knight.f[f]; break;
        case 'imp': spr = S.imp[Math.floor(e.t * 10) % 2]; break;
      }
      const sh = e.fly ? 10 : 0, hover = e.fly ? Math.sin(e.t * 8 + e.x) * 2 : 0;
      ctx.globalAlpha = 0.3; ctx.fillStyle = '#000'; const sw = Math.round(e.r * (e.fly ? 1.0 : 1.5)); ctx.fillRect(Math.round(e.x) - sw, Math.round(e.y) + 2, sw * 2, 2); ctx.fillRect(Math.round(e.x) - sw + 1, Math.round(e.y) + 1, sw * 2 - 2, 4); ctx.globalAlpha = 1;
      if (e.elite) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.2 * Math.sin(time * 6); const g = S.glow('#ffd040', 22); ctx.drawImage(g, Math.round(e.x - 22), Math.round(e.y - 28)); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
      const wob = e.pose === 'wind' || e.pose === 1 && e.type !== 'slime' ? Math.sin(time * 50) * 0.6 : 0;
      S.draw(ctx, spr, e.x + wob, e.y - e.z - sh + hover, e.face < 0, e.flash > 0, e.alpha);
      if (e.armor && (e.pose === 1 || e.pose === 'wind' || e.pose === 'cast') && Math.floor(time * 14) % 2 === 0) S.text(ctx, '!', e.x, e.y - e.r * 2 - 16 - sh, '#ff3b3b', 2, 'center');
      if (e.hp < e.maxHp && !e.boss) { const w = 14, x = Math.round(e.x - w / 2), y = Math.round(e.y - e.r * 2 - 10 - sh); ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 4); ctx.fillStyle = '#5a1a2a'; ctx.fillRect(x, y, w, 2); ctx.fillStyle = e.elite ? '#ffd040' : '#ff4a5a'; ctx.fillRect(x, y, Math.max(1, Math.round(w * e.hp / e.maxHp)), 2); }
      if (e.type === 'knight' && !e.exposed) { ctx.fillStyle = '#9aa6c8'; ctx.fillRect(Math.round(e.x) - 3, Math.round(e.y) - e.r * 2 - 16, 6, 1); }
    },
    drawSpawn(ctx, e, time) {
      const k = e.spawnT / 0.9, r = 4 + 10 * (0.4 + 0.6 * k);
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#7a4cc8'; S.disc(ctx, e.x, e.y, Math.round(r), '#4a2a8a'); ctx.globalAlpha = 1;
      ctx.fillStyle = '#d8b8ff'; for (let i = 0; i < 8; i++) { const a = time * 8 + i * TAU / 8, rr = r * (1 - k * 0.3); ctx.fillRect(Math.round(e.x + Math.cos(a) * rr), Math.round(e.y + Math.sin(a) * rr * 0.6), 1, 1); }
      ctx.globalAlpha = k; S.draw(ctx, S.orb, e.x, e.y); ctx.globalAlpha = 1;
    },
  };
})(window.PC);
