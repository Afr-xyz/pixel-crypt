// Boss: Bone Colossus, Morgana, Ashgor. Pola serangan = generator; fase naik saat HP turun.
window.PC = window.PC || {};
(function (PC) {
  const G = PC.G, U = PC.U, C = PC.C, W = PC.World, S = PC.S, E = PC.Enemies;
  const { dist, angle, rand, wait, during, TAU } = U;
  const P = () => G.player;
  const aimAt = e => angle(e.x, e.y, P().x, P().y);
  const faceP = e => { e.face = P().x < e.x ? -1 : 1; };
  const toward = (e, x, y, sp) => { const a = angle(e.x, e.y, x, y); e.mx = Math.cos(a) * sp; e.my = Math.sin(a) * sp; };
  const track = (e, until) => z => { if (z.t < until) { z.x = e.x; z.y = e.y; z.a = aimAt(e); } };
  const minions = () => G.enemies.filter(x => !x.boss && !x.dead).length;
  const fan = (x, y, a, n, spread, speed, dmg, col, r, extra) => { for (let i = 0; i < n; i++) G.addProj(Object.assign({ x, y, a: a - spread / 2 + (n === 1 ? spread / 2 : spread * i / (n - 1)), speed, r: r || 3, dmg, col, life: 4 }, extra)); };
  const ring = (x, y, n, speed, dmg, off, col, r) => { for (let i = 0; i < n; i++) G.addProj({ x, y, a: off + i * TAU / n, speed, r: r || 3, dmg, col, life: 5 }); };
  const pick = (opts, last) => { const f = opts.filter(o => o[0] !== last), tot = f.reduce((s, o) => s + o[1], 0); let r = Math.random() * tot; for (const o of f) { r -= o[1]; if (r <= 0) return o[0]; } return f[0][0]; };
  const sound = n => PC.Audio.play(n);
  const scale = e => 1; // damage boss tidak naik per lantai (sudah dirancang per boss)

  function* transition(e, text, col) {
    e.gz = null; e.hg = null; e.invuln = true; e.contactDmg = 0; e.pose = 'raise'; for (let i = G.zones.length - 1; i >= 0; i--) if (G.zones[i].owner === e) G.zones.splice(i, 1); for (let i = G.projs.length - 1; i >= 0; i--) if (G.projs[i].hostile) G.projs.splice(i, 1);
    sound('roar'); G.addShake(8); G.flash(col || '#ff3b3b', 0.4); G.text(e.x, e.y - e.r * 2 - 10, text, '#ff5a5a', 2);
    G.addRing({ x: e.x, y: e.y, speed: 150, dmg: 8, th: 6, maxR: 320, col: col || '#ff8a2a' });
    yield* wait(1.6); e.invuln = false; e.pose = 'idle';
  }
  function* intro(e) {
    e.invuln = true; sound('roar'); G.addShake(6); if (G.banner) G.banner(C.BOSS[e.type].name, C.BOSS[e.type].sub);
    yield* wait(2.2); e.invuln = false;
  }
  function* breather(e, t, sp, minD) { yield* during(t, () => { e.pose = 'idle'; faceP(e); if (dist(e.x, e.y, P().x, P().y) > (minD || 45)) toward(e, P().x, P().y, sp === undefined ? e.speed : sp); }); }

  // ====================== BONE COLOSSUS ======================
  const COL = {
    *slam(e) {
      faceP(e); e.pose = 'raise'; G.addZone({ shape: 'circle', x: e.x, y: e.y, r: 54, delay: 0.95, dur: 0.12, dmg: 18, kb: 150, big: 6, owner: e });
      sound('telegraph'); yield* wait(0.95); e.pose = 'slam';
      if (e.phase >= 1) G.addRing({ x: e.x, y: e.y, speed: 115, dmg: 10, th: 6, maxR: 280, col: '#e8e0cc' });
      yield* wait(0.9);
    },
    *swipe(e) {
      const n = e.phase >= 1 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        faceP(e); e.pose = 'raise'; G.addZone({ shape: 'cone', x: e.x, y: e.y, a: aimAt(e), half: 1.15, range: 66, delay: 0.62, dur: 0.12, dmg: 16, kb: 110, big: 3, owner: e, follow: track(e, 0.35) });
        yield* wait(0.62); e.pose = 'slam'; yield* during(0.18, () => { const a = aimAt(e); e.mx = Math.cos(a) * 90; e.my = Math.sin(a) * 90; }); yield* wait(0.25);
      }
      yield* wait(0.3);
    },
    *charge(e) {
      faceP(e); e.pose = 'raise'; const z = G.addZone({ shape: 'rect', x: e.x, y: e.y, a: aimAt(e), len: 330, w: 32, delay: 0.85, dur: 0.05, warn: true, owner: e, follow: track(e, 0.5) });
      sound('telegraph'); yield* wait(0.85); const a = z.a, cx = Math.cos(a), cy = Math.sin(a); e.pose = 'idle'; e.contactDmg = 22; sound('roar');
      e.face = cx < 0 ? -1 : 1;
      yield* during(1.1, () => { e.mx = cx * 330; e.my = cy * 330; if (e.blocked) return false; });
      e.contactDmg = 0;
      if (e.blocked) {
        G.addShake(8); sound('slam'); G.burst(e.x, e.y, 20, '#e8e0cc', 90, 0.5, 2);
        if (e.phase >= 1) for (let i = 0; i < 5; i++) { const p = W.randomFree(10, null, 0); const q = i === 0 ? { x: P().x, y: P().y } : p; G.addZone({ shape: 'circle', x: q.x, y: q.y, r: 20, delay: 0.7 + i * 0.12, dur: 0.12, dmg: 11, kb: 80, big: 2, owner: e }); }
        e.pose = 'dizzy'; e.vulnMul = 1.3; yield* wait(1.7); e.vulnMul = 1;
      }
      e.pose = 'idle'; yield* wait(0.2);
    },
    *volley(e) {
      e.pose = 'raise'; yield* wait(0.5);
      for (let i = 0; i < 3; i++) { sound('fire'); ring(e.x, e.y, 10, 88, 8, i * 0.31, '#e8e0cc', 3); yield* wait(0.55); }
      e.pose = 'idle';
    },
    *summon(e) {
      e.pose = 'raise'; sound('roar'); G.addShake(4); e.lastSummon = e.t; yield* wait(0.6);
      for (let i = 0; i < 2; i++) { const p = W.randomFree(8, P(), 70); E.spawn('skeleton', p.x, p.y); }
      yield* wait(1.2); e.pose = 'idle';
    },
  };
  function* colossusLoop(e) {
    let last = ''; e.lastSummon = e.t;
    for (;;) {
      const d = dist(e.x, e.y, P().x, P().y), ph = e.phase;
      const opts = [['slam', d < 95 ? 3 : 1], ['swipe', d < 85 ? 3 : 1], ['charge', d > 80 ? 3 : 1]];
      if (ph >= 1) { opts.push(['volley', 2]); if (minions() < 3 && e.t - e.lastSummon > 16) opts.push(['summon', 5]); }
      last = pick(opts, last); yield* COL[last](e);
      yield* breather(e, ph ? 0.7 : 1.15, e.speed * (ph ? 1.3 : 1));
    }
  }

  // ====================== MORGANA ======================
  function* blink(e, minD, maxD) {
    e.untargetable = true; yield* during(0.25, (dt, k) => { e.alpha = 1 - k; }); G.burst(e.x, e.y, 14, '#7dff8a', 70, 0.5, 1);
    let pos; for (let i = 0; i < 30; i++) { pos = W.randomFree(e.r, P(), minD, 1); const d = dist(pos.x, pos.y, P().x, P().y); if (d >= minD && d <= maxD) break; }
    e.x = pos.x; e.y = pos.y; yield* during(0.25, (dt, k) => { e.alpha = k; }); e.alpha = 1; e.untargetable = false; G.burst(e.x, e.y, 14, '#7dff8a', 70, 0.5, 1);
  }
  const WIT = {
    *fan(e) {
      yield* blink(e, 90, 170); const n = e.phase ? 7 : 5, spread = e.phase ? 1.0 : 0.85;
      for (let k = 0; k < 2; k++) {
        faceP(e); e.pose = 'cast'; const z = G.addZone({ shape: 'cone', x: e.x, y: e.y, a: aimAt(e), half: spread / 2 + 0.04, range: 150, delay: 0.6, dur: 0.05, warn: true, color: '#ff5aff', owner: e, follow: track(e, 0.35) });
        yield* wait(0.6); sound('fire'); fan(e.x, e.y, z.a + (k ? spread / (n - 1) / 2 : 0), n, spread, 125, 9, '#ff5aff', 3); yield* wait(0.45);
      }
      e.pose = 'idle'; yield* wait(0.3);
    },
    *toxic(e) {
      e.pose = 'cast'; const n = e.phase ? 6 : 4, pools = G.zones.filter(z => z.pool).length; sound('telegraph');
      for (let i = 0; i < n && pools + i < 11; i++) {
        const p = P(); let x = p.x, y = p.y;
        if (i === 1) { x += PC.In.mx * 55; y += PC.In.my * 55; } else if (i > 1) { x += rand(-70, 70); y += rand(-45, 45); }
        x = U.clamp(x, 30, C.ROOM_W - 30); y = U.clamp(y, 52, C.ROOM_H - 26);
        G.addZone({ shape: 'circle', x, y, r: 25, delay: 1.0, dur: 5, dmg: 6, tick: 0.5, color: '#9aff4a', pool: '#5aff5a', persist: true, kb: 0, owner: null });
        yield* wait(0.22);
      }
      yield* wait(0.9); e.pose = 'idle';
    },
    *spiral(e) {
      const cx = C.ROOM_W / 2, cy = C.ROOM_H / 2 + 6; e.pose = 'cast';
      yield* during(0.7, () => toward(e, cx, cy, 120)); sound('roar');
      const arms = e.phase ? 3 : 2, total = e.phase ? 4.2 : 3.4; let ang = rand(0, TAU), dir = 1, t = 0, acc = 0, flipped = false;
      yield* during(total, (dt) => { t += dt; acc += dt; if (!flipped && t > total / 2) { dir = -1; flipped = true; } while (acc >= 0.09) { acc -= 0.09; ang += dir * 0.17; for (let i = 0; i < arms; i++) G.addProj({ x: e.x, y: e.y, a: ang + i * TAU / arms, speed: 82, r: 2.5, dmg: 7, col: '#7dff8a', life: 5 }); } });
      e.pose = 'idle'; yield* wait(0.5);
    },
    *lasers(e) {
      e.pose = 'cast'; faceP(e); sound('telegraph'); const a = aimAt(e);
      for (const off of [0, 0.5, -0.5]) G.addZone({ shape: 'rect', x: e.x, y: e.y, a: a + off, len: 360, w: 12, delay: 0.95, dur: 0.18, dmg: 14, kb: 90, big: 1, color: '#ff5aff', owner: e });
      yield* wait(0.55);
      for (const off of [0.25, -0.25, 0.75, -0.75]) G.addZone({ shape: 'rect', x: e.x, y: e.y, a: a + off, len: 360, w: 12, delay: 0.75, dur: 0.18, dmg: 14, kb: 90, big: 1, color: '#ff5aff', owner: e });
      yield* wait(1.4); e.pose = 'idle';
    },
    *bats(e) {
      e.pose = 'cast'; sound('roar'); yield* wait(0.5);
      for (let i = 0; i < 3; i++) { const p = W.randomFree(6, P(), 60); E.spawn('bat', p.x, p.y); }
      yield* wait(0.9); e.pose = 'idle';
    },
  };
  function* witchLoop(e) {
    let last = '';
    for (;;) {
      const ph = e.phase, opts = [['fan', 4], ['toxic', 3], ['spiral', 2]];
      if (ph >= 1) opts.push(['lasers', 3]); if (minions() < 2) opts.push(['bats', ph ? 1 : 2]);
      last = pick(opts, last); yield* WIT[last](e);
      yield* during(ph ? 0.5 : 0.9, () => { faceP(e); const d = dist(e.x, e.y, P().x, P().y); if (d < 80) toward(e, 2 * e.x - P().x, 2 * e.y - P().y, e.speed); });
    }
  }

  // ====================== ASHGOR ======================
  function meteors(e, n) {
    for (let i = 0; i < n; i++) {
      let x, y; if (i < 2) { x = P().x + PC.In.mx * 40 * i + rand(-10, 10); y = P().y + PC.In.my * 40 * i + rand(-10, 10); } else { const p = W.randomFree(8, null, 0); x = p.x; y = p.y; }
      x = U.clamp(x, 28, C.ROOM_W - 28); y = U.clamp(y, 50, C.ROOM_H - 24);
      G.addZone({ shape: 'circle', x, y, r: 23, delay: 0.9 + i * 0.11, dur: 0.14, dmg: 15, kb: 100, big: 2, color: '#ff5a2a', owner: e, cancel: false, onFire: z => G.burst(z.x, z.y, 12, ['#ff8a2a', '#ffd060', '#5a3a2a'], 80, 0.5, 2) });
    }
  }
  const DRG = {
    *breath(e) {
      faceP(e); e.pose = 'roar'; const dir = Math.random() < 0.5 ? 1 : -1, a = aimAt(e);
      const z = G.addZone({ shape: 'cone', x: e.x, y: e.y - 4, range: 140, half: 0.36, a: a - dir * 0.6, sweep: [a - dir * 0.6, a + dir * 0.6], delay: 0.95, dur: 1.15, dmg: 7, tick: 0.2, color: '#ff7a2a', owner: e, kb: 60, persist: true,
        follow: zz => { if (zz.t < 0.5) { const aa = aimAt(e); zz.sweep = [aa - dir * 0.6, aa + dir * 0.6]; zz.a = zz.sweep[0]; zz.x = e.x; zz.y = e.y - 4; } } });
      sound('roar'); if (e.phase >= 2) meteors(e, 5);
      yield* wait(0.95); sound('fire');
      yield* during(1.15, () => { for (let i = 0; i < 2; i++) { const d = rand(20, 135); G.burst(e.x + Math.cos(z.a + rand(-0.3, 0.3)) * d, e.y - 4 + Math.sin(z.a + rand(-0.3, 0.3)) * d, 1, ['#ff7a2a', '#ffd060', '#ff3b3b'], 25, 0.35, 2); } });
      e.pose = 'idle'; yield* wait(0.4);
    },
    *fireballs(e) {
      const volleys = e.phase >= 1 ? 4 : 3, n = e.phase >= 1 ? 5 : 3; e.pose = 'roar'; faceP(e); yield* wait(0.5);
      for (let i = 0; i < volleys; i++) { faceP(e); sound('fire'); fan(e.x + e.face * 16, e.y - 12, aimAt(e), n, 0.55, 130, 10, '#ff7a2a', 4, { noReflect: false }); if (e.phase >= 2 && i % 2 === 1) ring(e.x, e.y, 12, 90, 8, i, '#ffd060', 3); yield* wait(0.6); }
      e.pose = 'idle';
    },
    *meteor(e) { e.pose = 'roar'; sound('roar'); yield* wait(0.4); meteors(e, e.phase === 0 ? 7 : e.phase === 1 ? 10 : 13); yield* wait(1.5); e.pose = 'idle'; },
    *tail(e) {
      faceP(e); G.addZone({ shape: 'circle', x: e.x, y: e.y, r: 66, delay: 0.7, dur: 0.12, dmg: 17, kb: 170, big: 6, owner: e }); sound('telegraph'); e.pose = 'roar';
      yield* wait(0.7); e.pose = 'idle'; if (e.phase >= 2) ring(e.x, e.y, 14, 100, 9, 0, '#ffd060', 3); yield* wait(0.6);
    },
    *dive(e) {
      e.pose = 'fly'; sound('roar'); yield* during(0.5, (dt, k) => { e.alpha = 1 - k; }); e.untargetable = true; e.hidden = true;
      const z = G.addZone({ shape: 'circle', x: P().x, y: P().y, r: 36, delay: 1.75, dur: 0.15, dmg: 24, kb: 180, big: 9, owner: e, cancel: false, follow: (zz, dt) => { if (zz.t < 1.3) { zz.x += (P().x - zz.x) * Math.min(1, dt * 2.6); zz.y += (P().y - zz.y) * Math.min(1, dt * 2.6); } } });
      yield* wait(1.75); e.x = z.x; e.y = z.y; W.unstick(e); e.hidden = false; e.untargetable = false; e.alpha = 1; e.pose = 'idle';
      G.addRing({ x: e.x, y: e.y, speed: 135, dmg: 10, th: 6, maxR: 280, col: '#ffb060' }); G.burst(e.x, e.y, 24, ['#ff8a2a', '#ffd060'], 110, 0.6, 2);
      e.vulnMul = 1.25; yield* wait(1.1); e.vulnMul = 1;
    },
  };
  function* dragonLoop(e) {
    let last = '';
    for (;;) {
      const ph = e.phase, d = dist(e.x, e.y, P().x, P().y), opts = [['breath', d < 160 ? 4 : 2], ['fireballs', 3], ['meteor', 3], ['tail', d < 90 ? 4 : 0.5]];
      if (ph >= 1) opts.push(['dive', 3]);
      last = pick(opts, last); yield* DRG[last](e);
      yield* breather(e, ph >= 2 ? 0.5 : ph ? 0.8 : 1.2, e.speed * (1 + ph * 0.25), 70);
    }
  }

  // ====================== MEDUSA (CP2) ======================
  // Tatapan = kerucut dengan telegraph; garis pandang terblokir pilar/dinding. Terkena terus-menerus -> meter membatu -> MEMBATU (tekan tombol untuk bebas).
  const GZ_RANGE = 230, GZ_HALF = 0.55;
  const angDiff = U.angDiff, clampU = U.clamp;
  function rayClear(x0, y0, x1, y1) { const n = Math.ceil(dist(x0, y0, x1, y1) / 3); for (let i = 1; i < n; i++) { const t = i / n; if (W.solidAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; } return true; }
  function gazePoly(e, g) {
    const pts = [[e.x, e.y - 4]], N = 26;
    for (let i = 0; i <= N; i++) { const a = g.a - g.half + 2 * g.half * i / N, cx = Math.cos(a), cy = Math.sin(a); let d = 6; while (d < GZ_RANGE && !W.solidAt(e.x + cx * (d + 3), e.y + cy * (d + 3))) d += 3; pts.push([e.x + cx * d, e.y - 4 + cy * d]); }
    g.poly = pts;
  }
  function gazeExposed(e, g) {
    const p = P(), d = dist(e.x, e.y, p.x, p.y); if (d > GZ_RANGE || d < 1) return d < 1;
    const a = angle(e.x, e.y, p.x, p.y); if (Math.abs(angDiff(g.a, a)) > g.half + Math.atan2(4, d)) return false;
    const px = -Math.sin(a) * 4, py = Math.cos(a) * 4;
    return rayClear(e.x, e.y, p.x, p.y) || rayClear(e.x, e.y, p.x + px, p.y + py) || rayClear(e.x, e.y, p.x - px, p.y - py);
  }
  function drawGaze(ctx, z, time) {
    const e = z.owner, g = e && e.gz; if (!g || !g.poly || e.dead) return;
    const pulse = 0.5 + 0.5 * Math.sin(time * 18);
    ctx.save();
    if (g.arc) { ctx.globalAlpha = 0.1 + 0.05 * pulse; ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.moveTo(e.x, e.y - 4); ctx.arc(e.x, e.y - 4, GZ_RANGE, Math.min(g.arc[0], g.arc[1]) - g.half, Math.max(g.arc[0], g.arc[1]) + g.half); ctx.closePath(); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(g.poly[0][0], g.poly[0][1]); for (let i = 1; i < g.poly.length; i++) ctx.lineTo(g.poly[i][0], g.poly[i][1]); ctx.closePath();
    if (g.st === 'tele') { ctx.globalAlpha = 0.14 + 0.08 * pulse; ctx.fillStyle = '#ffe066'; ctx.fill(); ctx.globalAlpha = 0.8; ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 1; ctx.stroke(); }
    else if (g.st === 'lock') { ctx.globalAlpha = 0.3 + 0.2 * pulse; ctx.fillStyle = '#ff9a2a'; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke(); }
    else { ctx.globalAlpha = 0.5 + 0.1 * pulse; ctx.fillStyle = '#c8ff4a'; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
  }
  // Satu tatapan penuh: telegraph (melacak pemain, mengunci di 0.35 dtk terakhir) -> aktif. Mengembalikan true bila pemain membatu.
  function* gazeRun(e, o) {
    const g = e.gz = { a: aimAt(e), half: GZ_HALF, st: 'tele', poly: null, arc: null };
    const z = G.addZone({ shape: 'cone', x: e.x, y: e.y, delay: 0.01, dur: 99, dmg: 0, warn: true, owner: e, draw: drawGaze });
    e.pose = 'cast'; sound('telegraph'); let t = 0, hit = false;
    if (o.sweep) { g.a = aimAt(e) - Math.sign(o.sweep) * 0.9; g.arc = [g.a, g.a + o.sweep * o.on]; }
    yield* during(o.tele, dt => {
      t += dt; const lockT = o.tele - 0.35;
      if (t < lockT) { g.st = 'tele'; if (!o.sweep) g.a += clampU(angDiff(g.a, aimAt(e)), -2.2 * dt, 2.2 * dt); } else g.st = 'lock';
      gazePoly(e, g);
    });
    g.st = 'on'; sound('roar'); G.addShake(2);
    yield* during(o.on, dt => {
      if (o.sweep) g.a += o.sweep * dt;
      gazePoly(e, g);
      if (gazeExposed(e, g) && PC.Player.gazeHit(dt, o.need)) { hit = true; return false; }
    });
    e.gz = null; z.delay = 0; z.dur = 0; return hit;
  }
  function* kite(e, t) { e.pose = 'idle'; yield* during(t, () => { const d = dist(e.x, e.y, P().x, P().y); if (d < 90) toward(e, 2 * e.x - P().x, 2 * e.y - P().y, e.speed * 1.2); else if (d > 160) toward(e, P().x, P().y, e.speed); }); }
  const MED = {
    *gaze(e) {
      const ph = e.phase, o = { tele: ph ? 1.0 : 1.25, on: 0.9, need: ph ? 0.42 : 0.5 };
      for (let k = 0; k < (ph ? 2 : 1); k++) {
        if (k) { o.tele = 0.85; yield* wait(0.25); }
        if (yield* gazeRun(e, o)) { // membatu: pecahan bertelegraf, bisa dihindari dengan menekan tombol (tiap tekan -0.2 dtk)
          const p = P(); G.addZone({ shape: 'circle', x: p.x, y: p.y, r: 22, delay: 1.35, dur: 0.14, dmg: 20, kb: 90, big: 4, shatter: true, color: '#c8ccd8', owner: e, cancel: false }); sound('telegraph');
          e.pose = 'raise'; yield* wait(1.55); e.pose = 'idle'; return;
        }
      }
      e.pose = 'dizzy'; e.vulnMul = 1.35; yield* wait(ph ? 1.0 : 1.3); e.vulnMul = 1; e.pose = 'idle'; // fase rentan: mata terpejam
    },
    *sweep(e) {
      const ph = e.phase, dir = Math.random() < 0.5 ? 1 : -1;
      if (yield* gazeRun(e, { tele: 1.3, on: 1.9, sweep: dir * (ph ? 1.15 : 0.95), need: ph ? 0.42 : 0.5 })) {
        const p = P(); G.addZone({ shape: 'circle', x: p.x, y: p.y, r: 22, delay: 1.35, dur: 0.14, dmg: 20, kb: 90, big: 4, shatter: true, color: '#c8ccd8', owner: e, cancel: false }); sound('telegraph');
        e.pose = 'raise'; yield* wait(1.55); e.pose = 'idle'; return;
      }
      e.pose = 'dizzy'; e.vulnMul = 1.35; yield* wait(1.1); e.vulnMul = 1; e.pose = 'idle';
    },
    *volley(e) {
      const ph = e.phase, n = ph ? 7 : 5, spread = ph ? 1.05 : 0.9;
      for (let k = 0; k < (ph ? 3 : 2); k++) {
        faceP(e); e.pose = 'raise'; const z = G.addZone({ shape: 'cone', x: e.x, y: e.y, a: aimAt(e), half: spread / 2 + 0.04, range: 160, delay: 0.62, dur: 0.05, warn: true, color: '#7dff4a', owner: e, follow: track(e, 0.4) });
        sound('telegraph'); yield* wait(0.62); sound('fire'); fan(e.x, e.y - 8, z.a, n, spread, 120, 9, '#7dff4a', 3); yield* wait(0.5);
      }
      e.pose = 'idle'; yield* wait(0.3);
    },
    *tail(e) {
      faceP(e); e.pose = 'slam'; G.addZone({ shape: 'circle', x: e.x, y: e.y, r: 48, delay: 0.75, dur: 0.12, dmg: 16, kb: 150, big: 5, color: '#7dff4a', owner: e }); sound('telegraph');
      yield* wait(0.75); if (e.phase) ring(e.x, e.y, 10, 80, 8, rand(0, 1), '#7dff4a', 3); yield* wait(0.7); e.pose = 'idle';
    },
  };
  function* medusaLoop(e) {
    let last = '', first = true;
    for (;;) {
      const d = dist(e.x, e.y, P().x, P().y), ph = e.phase, opts = [['gaze', 4], ['sweep', ph ? 3 : 2], ['volley', 3]]; if (d < 95) opts.push(['tail', 5]);
      last = first ? 'gaze' : pick(opts, last); first = false; yield* MED[last](e);
      yield* kite(e, ph ? 0.6 : 0.9);
    }
  }

  // ====================== CERBERUS (CP3) ======================
  // 3 kepala berwarna: Api (kiri, oranye) = proyektil; Taring (tengah, merah) = gigitan jarak dekat; Roh (kanan, biru) = lajur & palang.
  // Setiap 2 serangan Cerberus kelelahan (dizzy, damage x1.3) -> jendela serang balik. Semua zona bertelegraf >= 0.55 dtk.
  const HC = ['#ff7a2a', '#ff3b3b', '#5ab0ff'];
  const hx = (e, i) => e.x + (i - 1) * 15;
  const headOf = off => off < -0.5 ? 0 : off > 0.5 ? 2 : 1;
  const CER = {
    *triple(e) { // lajur dari beberapa arah sekaligus; celah aman di antara lajur (3/4/5 lajur sesuai fase)
      const ph = e.phase, offs = ph === 0 ? [-0.8, 0, 0.8] : ph === 1 ? [-1.05, -0.35, 0.35, 1.05] : [-1.2, -0.6, 0, 0.6, 1.2];
      e.pose = 'roar'; e.hg = [1, 1, 1]; sound('telegraph');
      for (const off of offs) { const i = headOf(off); G.addZone({ shape: 'rect', x: hx(e, i), y: e.y - 4, a: aimAt(e) + off, len: 340, w: 14, delay: 1.0, dur: 0.14, dmg: 15, kb: 110, big: 2, color: HC[i], owner: e, follow: z => { if (z.t < 0.5) z.a = aimAt(e) + off; } }); }
      yield* wait(1.0); sound('fire'); G.addShake(3); yield* wait(0.35); e.hg = null; e.pose = 'idle';
    },
    *fireball(e) { // kepala Api
      const ph = e.phase; e.pose = 'roar'; e.hg = [1, 0, 0];
      for (let k = 0; k < (ph ? 4 : 3); k++) {
        const n = ph ? 5 : 3, spread = 0.5, z = G.addZone({ shape: 'cone', x: hx(e, 0), y: e.y - 4, a: aimAt(e), half: spread / 2 + 0.04, range: 170, delay: 0.55, dur: 0.05, warn: true, color: HC[0], owner: e, follow: zz => { if (zz.t < 0.3) zz.a = aimAt(e); } });
        yield* wait(0.55); sound('fire'); fan(hx(e, 0), e.y - 8, z.a, n, spread, 130, 10, HC[0], 4); if (ph >= 2 && k % 2) ring(e.x, e.y, 10, 85, 8, rand(0, 1), HC[0], 3); yield* wait(0.3);
      }
      e.hg = null; e.pose = 'idle';
    },
    *bite(e) { // kepala Taring: serudukan gigitan jarak dekat
      e.hg = [0, 1, 0]; faceP(e); e.pose = 'raise';
      const z = G.addZone({ shape: 'cone', x: e.x, y: e.y, a: aimAt(e), half: 0.95, range: 78, delay: 0.7, dur: 0.12, dmg: 20, kb: 140, big: 4, color: HC[1], owner: e, follow: track(e, 0.4) });
      sound('telegraph'); yield* wait(0.7); e.pose = 'slam'; yield* during(0.2, () => { e.mx = Math.cos(z.a) * 130; e.my = Math.sin(z.a) * 130; }); yield* wait(0.25); e.hg = null; e.pose = 'idle';
    },
    *crossfire(e) { // palang horizontal + vertikal dari dua arah di posisi (terprediksi) pemain
      const ph = e.phase; e.pose = 'roar'; e.hg = [0, 1, 1]; sound('telegraph');
      for (let k = 0; k < (ph ? 2 : 1); k++) {
        const p = P(), x = U.clamp(p.x + PC.In.mx * 45, 30, C.ROOM_W - 30), y = U.clamp(p.y + PC.In.my * 30, 52, C.ROOM_H - 26);
        G.addZone({ shape: 'rect', x: 20, y, a: 0, len: C.ROOM_W - 40, w: 18, delay: 1.0, dur: 0.14, dmg: 14, kb: 90, big: 2, color: HC[2], owner: e });
        G.addZone({ shape: 'rect', x, y: 40, a: Math.PI / 2, len: C.ROOM_H - 60, w: 18, delay: 1.0, dur: 0.14, dmg: 14, kb: 90, big: 2, color: HC[1], owner: e });
        yield* wait(k ? 0.4 : 0.6);
      }
      yield* wait(1.0); e.hg = null; e.pose = 'idle';
    },
    *rotor(e) { // fase >=1 (HP<=66%): tiga sapuan api berputar, celah 120 derajat
      const dir = Math.random() < 0.5 ? 1 : -1, base = aimAt(e); e.pose = 'roar'; e.hg = [1, 1, 1]; sound('roar');
      for (let i = 0; i < 3; i++) { const a0 = base + i * TAU / 3; G.addZone({ shape: 'cone', x: e.x, y: e.y - 4, range: 150, half: 0.2, a: a0, sweep: [a0, a0 + 1.1 * dir], delay: 1.1, dur: 1.5, dmg: 6, tick: 0.2, color: HC[i], owner: e, kb: 60, persist: true }); }
      yield* wait(2.7); e.hg = null; e.pose = 'idle';
    },
  };
  function* cerberusLoop(e) {
    let last = '', n = 0;
    for (;;) {
      const d = dist(e.x, e.y, P().x, P().y), ph = e.phase, opts = [['triple', 3], ['fireball', 3], ['crossfire', 2], ['bite', d < 110 ? 5 : 1]]; if (ph >= 1) opts.push(['rotor', 2]);
      last = pick(opts, last); yield* CER[last](e); e.hg = null; n++;
      if (n >= 2) { n = 0; e.pose = 'dizzy'; e.vulnMul = 1.3; yield* wait(ph >= 2 ? 1.1 : 1.5); e.vulnMul = 1; e.pose = 'idle'; } // jendela serang balik
      else yield* breather(e, ph >= 2 ? 0.5 : 0.8, e.speed * (1 + ph * 0.2), 85);
    }
  }

  // ====================== MINOTAUR (CP4) ======================
  // Charge: lajur merah (lebar = hitbox kontak) melacak pemain lalu memutih = terkunci 0.45 dtk sebelum menyeruduk lurus.
  // Menabrak dinding/pilar -> pusing (rentan). Pilar = pusing lebih lama. Hanya menyeruduk bila jarak >= 90 dan jalur >= 110.
  const MT = C.TILE;
  function hitPillar(e, a) { const g = W.room.grid; for (const da of [0, -0.5, 0.5]) { const x = e.x + Math.cos(a + da) * (e.r + 3), y = e.y + Math.sin(a + da) * (e.r + 3); const r = g[Math.floor(y / MT)]; if (r && r[Math.floor(x / MT)] === 2) return true; } return false; }
  function* chargeRun(e, o) {
    faceP(e); e.pose = 'raise'; const w = (e.r + 4) * 2, lockT = o.tele - 0.45; sound('telegraph');
    const z = G.addZone({ shape: 'rect', x: e.x, y: e.y, a: aimAt(e), len: 100, w, delay: o.tele, dur: 0.05, warn: true, color: '#ff5a3a', owner: e,
      follow: zz => { zz.x = e.x; zz.y = e.y; if (zz.t < lockT) zz.a = aimAt(e); zz.len = W.rayEnd(e.x, e.y, zz.a, 420, e.r) + e.r; zz.color = zz.t >= lockT ? '#ffffff' : '#ff5a3a'; e.face = Math.cos(zz.a) < 0 ? -1 : 1; } });
    yield* wait(o.tele); const a = z.a, cx = Math.cos(a), cy = Math.sin(a), maxT = Math.min(1.3, z.len / o.speed + 0.2);
    e.pose = 'slam'; e.contactDmg = 22; sound('roar'); e.blocked = false;
    yield* during(maxT, () => { e.mx = cx * o.speed; e.my = cy * o.speed; if (Math.random() < 0.6) G.burst(e.x - cx * 12, e.y + 4, 1, ['#c8b89a', '#8a7a5a'], 30, 0.3, 1); if (e.blocked) return false; });
    e.contactDmg = 0; const hit = e.blocked;
    if (hit) { // tabrakan: pusing, jendela serang balik
      const pil = hitPillar(e, a); G.addShake(8); sound('slam'); G.burst(e.x + cx * e.r, e.y + cy * e.r, 22, ['#c8b89a', '#8a7a5a', '#fff'], 100, 0.5, 2); G.text(e.x, e.y - e.r * 2 - 14, pil ? 'TERJEPIT!' : 'BENTUR!', '#ffe066', 2);
      if (e.phase >= 1 && !pil) for (let i = 0; i < 4; i++) { const q = i === 0 ? { x: P().x, y: P().y } : W.randomFree(10, null, 0); G.addZone({ shape: 'circle', x: q.x, y: q.y, r: 20, delay: 0.9 + i * 0.12, dur: 0.12, dmg: 11, kb: 80, big: 2, color: '#c8b89a', owner: e }); }
      e.pose = 'dizzy'; e.vulnMul = pil ? 1.6 : 1.4; yield* wait(pil ? (e.phase ? 2.0 : 2.4) : (e.phase ? 1.5 : 1.8)); e.vulnMul = 1;
    } else { e.pose = 'idle'; e.vulnMul = 1.15; yield* wait(0.7); e.vulnMul = 1; }
    e.pose = 'idle'; yield* wait(0.2);
  }
  const MNT = {
    *charge(e) { yield* chargeRun(e, { tele: e.phase ? 0.9 : 1.05, speed: e.phase ? 340 : 300 }); },
    *charge2(e) { yield* chargeRun(e, { tele: 0.95, speed: 340 }); yield* wait(0.1); if (dist(e.x, e.y, P().x, P().y) > 90 && W.rayEnd(e.x, e.y, aimAt(e), 420, e.r) > 110) yield* chargeRun(e, { tele: 0.8, speed: 340 }); },
    *stomp(e) { // hentakan tanah: lingkaran bertelegraf; fase 1: gelombang kejut cincin
      faceP(e); e.pose = 'raise'; G.addZone({ shape: 'circle', x: e.x, y: e.y, r: 64, delay: 0.85, dur: 0.12, dmg: 18, kb: 160, big: 6, color: '#ff7a3a', owner: e }); sound('telegraph');
      yield* wait(0.85); e.pose = 'slam'; if (e.phase >= 1) G.addRing({ x: e.x, y: e.y, speed: 115, dmg: 10, th: 6, maxR: 260, col: '#e8c89a' }); yield* wait(0.9); e.pose = 'idle';
    },
    *punch(e) { // pukulan berat jarak dekat
      faceP(e); e.pose = 'raise'; G.addZone({ shape: 'cone', x: e.x, y: e.y, a: aimAt(e), half: 0.85, range: 58, delay: 0.65, dur: 0.12, dmg: 22, kb: 150, big: 4, color: '#ff5a3a', owner: e, follow: track(e, 0.35) });
      sound('telegraph'); yield* wait(0.65); e.pose = 'slam'; yield* during(0.15, () => { const a = aimAt(e); e.mx = Math.cos(a) * 90; e.my = Math.sin(a) * 90; }); yield* wait(0.65); e.pose = 'idle';
    },
  };
  // Navigasi: bila garis lurus ke target terhalang pilar, menuju sudut pilar terdekat yang jalurnya bebas (tanpa pathfinding penuh).
  function clearPath(x0, y0, x1, y1, rad) { const n = Math.ceil(dist(x0, y0, x1, y1) / 6); for (let i = 1; i <= n; i++) { const t = i / n; if (W.hitsSolid(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, rad)) return false; } return true; }
  function pathDir(e, tx, ty) {
    const rad = e.r; if (!e.blocked && clearPath(e.x, e.y, tx, ty, rad)) { e.wp = null; return [tx, ty]; }
    if (e.wp && e.t < e.wp.until && dist(e.x, e.y, e.wp.x, e.wp.y) > 8 && clearPath(e.x, e.y, e.wp.x, e.wp.y, rad)) return [e.wp.x, e.wp.y];
    let best = null, bs = 1e9; const off = MT / 2 + e.r + 3;
    for (const pl of W.room.pillars) for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const wx = pl.c * MT + 8 + sx * off, wy = pl.r * MT + 8 + sy * off; if (!W.inBounds(wx, wy, e.r) || W.hitsSolid(wx, wy, rad) || !clearPath(e.x, e.y, wx, wy, rad)) continue;
      const sc = dist(e.x, e.y, wx, wy) + dist(wx, wy, tx, ty) * 1.1; if (sc < bs && dist(e.x, e.y, wx, wy) > 10) { bs = sc; best = { x: wx, y: wy }; }
    }
    if (best) { e.wp = { x: best.x, y: best.y, until: e.t + 0.8 }; return [best.x, best.y]; }
    return [tx, ty];
  }
  function* chase(e, t, sp, minD, stop) { yield* during(t, () => { e.pose = 'idle'; faceP(e); if (stop && stop()) return false; if (dist(e.x, e.y, P().x, P().y) > minD) { const [tx, ty] = pathDir(e, P().x, P().y); toward(e, tx, ty, sp); } }); }
  function* retreat(e) { // mundur ke titik dengan jalur seruduk panjang ke pemain
    let best = null, bs = -1; const p = P();
    for (let k = 0; k < 48; k++) { const a = (k % 16) * TAU / 16, R = [130, 95, 60][k >> 4], x = e.x + Math.cos(a) * R, y = e.y + Math.sin(a) * R; if (best && k >= 16 && bs > 0 && (k >> 4) > 0 && best.R >= R) continue; if (!W.inBounds(x, y, e.r + 4) || W.hitsSolid(x, y, e.r) || !clearPath(e.x, e.y, x, y, e.r - 2)) continue; const L = dist(x, y, p.x, p.y) + (W.rayEnd(x, y, angle(x, y, p.x, p.y), 420, e.r) > 150 ? 100 : 0); if (L > bs) { bs = L; best = { x, y, R }; } }
    e.pose = 'idle'; if (!best) { yield* wait(0.3); return; }
    yield* during(1.3, () => { faceP(e); if (dist(e.x, e.y, best.x, best.y) < 8) return false; toward(e, best.x, best.y, e.speed * 2.4); });
  }
  function* minotaurLoop(e) {
    let last = '', force = true, rt = 0;
    for (;;) {
      const d = dist(e.x, e.y, P().x, P().y), ph = e.phase, ray = W.rayEnd(e.x, e.y, aimAt(e), 420, e.r), ok = d > 90 && ray > 110;
      if (!ok && d > 130) { yield* chase(e, 1.0, e.speed * 1.7, 70, () => force && dist(e.x, e.y, P().x, P().y) > 90 && W.rayEnd(e.x, e.y, aimAt(e), 420, e.r) > 110); continue; } // terhalang pilar / terlalu jauh: memutar dulu
      const opts = [['stomp', d < 100 ? 3 : 0.5], ['punch', d < 75 ? 4 : 0.3]];
      if (ok) { opts.push(['charge', 8]); if (ph >= 1) opts.push(['charge2', 3]); } else opts.push(['retreat', 11]); // terlalu dekat: mundur cari ruang seruduk
      last = force && ok ? 'charge' : (force && !ok && rt < 3 ? 'retreat' : pick(opts, last)); rt = last === 'retreat' ? rt + 1 : 0; force = last === 'retreat';
      if (last === 'retreat') yield* retreat(e); else yield* MNT[last](e);
      yield* chase(e, ph ? 0.4 : 0.6, e.speed * (1 + ph * 0.3), 70);
    }
  }

  // ====================== ZEUS (CP5) — boss terakhir, 3 fase, petir bertelegraf ======================
  const ZC = '#ffe84a', ZB = '#8ad8ff';
  const zclamp = (x, y) => [Math.max(20, Math.min(C.ROOM_W - 20, x)), Math.max(24, Math.min(C.ROOM_H - 20, y))];
  function bolt(e, x, y, r, delay, dmg) { // petir jatuh: lingkaran bertelegraf; saat menyambar kilatan + guncangan
    [x, y] = zclamp(x, y);
    return G.addZone({ shape: 'circle', x, y, r, delay, dur: 0.14, dmg: dmg || 18, kb: 120, big: 3, color: ZC, owner: e, onFire: z => { G.flash('#fff6b0', 0.12); for (let i = 0; i < 6; i++) G.burst(z.x, z.y - i * 9, 2, [ZC, '#fff', ZB], 40, 0.3, 1); } });
  }
  function zlane(e, x, y, a, w, delay, dmg, lockAt) {
    return G.addZone({ shape: 'rect', x, y, a, len: 380, w, delay, dur: 0.14, dmg: dmg || 16, kb: 110, big: 2, color: ZC, owner: e, follow: lockAt ? z => { if (z.t < lockAt) { z.x = e.x; z.y = e.y - 4; z.a = aimAt(e); } } : undefined, onFire: () => G.flash('#fff6b0', 0.1) });
  }
  const ZS = {
    *bolts(e) { // petir terarah ke posisi pemain, beruntun; pemain harus terus bergerak
      const ph = e.phase, n = 3 + ph, gap = ph === 2 ? 0.36 : 0.48; e.pose = 'raise'; sound('telegraph');
      for (let k = 0; k < n; k++) { bolt(e, P().x + (k && ph ? rand(-16, 16) : 0), P().y + (k && ph ? rand(-16, 16) : 0), 32, 0.9 - ph * 0.05); yield* wait(gap); }
      yield* wait(0.9); e.pose = 'idle';
    },
    *beam(e) { // lajur petir lurus dari Zeus: melacak 0.5 dtk lalu terkunci
      const ph = e.phase, offs = ph === 2 ? [-0.55, 0, 0.55] : ph === 1 ? [-0.4, 0.4] : [0]; e.pose = 'raise'; faceP(e); sound('telegraph');
      for (const off of offs) { const z = zlane(e, e.x, e.y - 4, aimAt(e) + off, 15, 1.05, 16, 0.5); z.off = off; z.follow = zz => { if (zz.t < 0.5) { zz.x = e.x; zz.y = e.y - 4; zz.a = aimAt(e) + off; } }; }
      yield* wait(1.05); e.pose = 'slam'; sound('fire'); G.addShake(3); yield* wait(0.5); e.pose = 'idle';
    },
    *orbs(e) { // bola energi: kipas lambat, bisa dihindari / dodge
      const ph = e.phase; e.pose = 'raise';
      for (let k = 0; k < 3; k++) { const z = G.addZone({ shape: 'cone', x: e.x, y: e.y - 6, a: aimAt(e), half: 0.45 + ph * 0.1, range: 150, delay: 0.55, dur: 0.05, warn: true, color: ZB, owner: e, follow: zz => { if (zz.t < 0.3) { zz.x = e.x; zz.y = e.y - 6; zz.a = aimAt(e); } } }); yield* wait(0.55); sound('fire'); fan(e.x, e.y - 8, z.a, ph ? 7 : 5, 0.9 + ph * 0.2, 95, 9, ZB, 4); yield* wait(0.3); }
      e.pose = 'idle';
    },
    *chain(e) { // gelombang petir bergulir dari Zeus menuju pemain: geser menyamping
      const ph = e.phase, a = aimAt(e), n = ph === 2 ? 8 : 6; e.pose = 'raise'; faceP(e); sound('telegraph');
      for (let k = 0; k < n; k++) { bolt(e, e.x + Math.cos(a) * (28 + k * 36), e.y + Math.sin(a) * (28 + k * 36), 24, 0.85, 14); yield* wait(0.16); }
      yield* wait(0.95); e.pose = 'idle';
    },
    *rain(e) { // hujan petir acak + satu di pemain; ada celah aman; makin cepat tiap ronde
      const ph = e.phase, rounds = ph === 2 ? 3 : 2; e.pose = 'raise'; sound('telegraph');
      for (let k = 0; k < rounds; k++) {
        bolt(e, P().x, P().y, 30, 1.0 - 0.1 * k);
        for (let i = 0; i < 6 + ph; i++) { const a = rand(0, TAU), d = rand(25, 130); bolt(e, P().x + Math.cos(a) * d, P().y + Math.sin(a) * d, 30, 1.0 - 0.1 * k); }
        yield* wait(0.8);
      }
      yield* wait(0.8); e.pose = 'idle';
    },
    *spokes(e) { // jari-jari petir dari Zeus; wedge aman di antara jari-jari; fase 2: set kedua digeser setengah langkah
      const ph = e.phase, n = ph === 2 ? 8 : 6, off = rand(0, TAU); e.pose = 'raise'; sound('telegraph');
      for (let i = 0; i < n; i++) zlane(e, e.x, e.y - 4, off + i * TAU / n, 14, 1.15, 14);
      if (ph === 2) { yield* wait(0.8); for (let i = 0; i < n; i++) zlane(e, e.x, e.y - 4, off + (i + 0.5) * TAU / n, 14, 0.95, 14); sound('telegraph'); yield* wait(0.95); } else yield* wait(1.15);
      sound('fire'); G.addShake(3); yield* wait(0.55); e.pose = 'idle';
    },
    *wrath(e) { // fase 3: murka — ledakan besar di sekitar Zeus + cincin; setelah itu Zeus kelelahan
      e.pose = 'raise'; sound('roar'); G.addZone({ shape: 'circle', x: e.x, y: e.y, r: 92, delay: 1.4, dur: 0.16, dmg: 22, kb: 170, big: 6, color: ZC, owner: e, onFire: () => G.flash('#fff6b0', 0.25) });
      yield* wait(1.4); e.pose = 'slam'; ring(e.x, e.y, 14, 80, 9, rand(0, 1), ZB, 3); yield* wait(0.8); e.pose = 'idle';
    },
  };
  function* zeusDrift(e, t) { // jaga jarak ~110 px dari pemain
    yield* during(t, () => { e.pose = 'idle'; faceP(e); const d = dist(e.x, e.y, P().x, P().y), a = aimAt(e); if (d < 90) { e.mx = -Math.cos(a) * e.speed; e.my = -Math.sin(a) * e.speed; } else if (d > 150) toward(e, P().x, P().y, e.speed); else { e.mx = 0; e.my = 0; } });
    e.mx = e.my = 0;
  }
  function* zeusLoop(e) {
    let last = '', n = 0;
    for (;;) {
      const ph = e.phase; yield* zeusDrift(e, 0.7 - ph * 0.1);
      const opts = ph === 0 ? [['bolts', 4], ['beam', 3], ['orbs', 2]] : ph === 1 ? [['bolts', 3], ['beam', 2], ['orbs', 1], ['rain', 3], ['chain', 3], ['spokes', 2]] : [['bolts', 2], ['beam', 2], ['rain', 3], ['chain', 3], ['spokes', 3]];
      n++; last = ph === 2 && n % 4 === 0 ? 'wrath' : pick(opts, last); e.mx = e.my = 0; faceP(e); yield* ZS[last](e);
      e.pose = 'dizzy'; e.vulnMul = last === 'wrath' ? 1.5 : 1.3; G.text(e.x, e.y - 40, 'LELAH!', '#ffe066', 1); yield* wait(last === 'wrath' ? 1.6 : 1.5 - ph * 0.25); e.vulnMul = 1; e.pose = 'idle';
    }
  }

  // ====================== PLACEHOLDER (CP1) — boss 4-7 sampai mekanik aslinya dibuat ======================
  // Aman: hanya telegraf lingkaran + cincin peluru + jeda serangan. BUKAN implementasi final.
  function* placeholderLoop(e) {
    let last = '';
    for (;;) {
      last = pick([['slam', 3], ['ring', 2]], last);
      if (last === 'slam') {
        faceP(e); e.pose = 'raise'; G.addZone({ shape: 'circle', x: e.x, y: e.y, r: 52, delay: 0.95, dur: 0.12, dmg: 16, kb: 140, big: 5, owner: e }); sound('telegraph');
        yield* wait(0.95); e.pose = 'slam'; yield* wait(0.8);
      } else {
        e.pose = 'raise'; yield* wait(0.5); for (let i = 0; i < 2; i++) { sound('fire'); ring(e.x, e.y, 8 + e.phase * 2, 85, 8, i * 0.4, '#ffffff', 3); yield* wait(0.6); } e.pose = 'idle';
      }
      e.vulnMul = 1.2; yield* breather(e, 1.3 - e.phase * 0.25, e.speed); e.vulnMul = 1;
    }
  }

  const LOOPS = { colossus: colossusLoop, witch: witchLoop, dragon: dragonLoop, medusa: medusaLoop, cerberus: cerberusLoop, minotaur: minotaurLoop, zeus: zeusLoop };
  const TRANS = { colossus: ['TERPANCING!'], witch: ['MURKA!'], dragon: ['MURKA!', 'AMUK!'], medusa: ['TATAPAN TERKUTUK!'], cerberus: ['TIGA KEPALA!', 'NERAKA MENGAMUK!'], minotaur: ['AMUK BANTENG!'], zeus: ['BADAI PETIR!', 'MURKA ZEUS!'] };
  const TCOL = { colossus: '#ff3b3b', witch: '#ff5aff', dragon: '#ff7a2a', medusa: '#7dff8a', cerberus: '#ff4a2a', minotaur: '#ff6a4a', zeus: '#ffe84a' };

  const B = PC.Bosses = {
    spawn(kind) {
      const d = C.BOSS[kind];
      const e = { type: kind, boss: true, name: d.name + (d.placeholder ? ' [SEMENTARA]' : ''), x: C.ROOM_W * 0.74, y: C.ROOM_H / 2 + 8, r: d.r, hp: d.hp, maxHp: d.hp, speed: d.speed, dmg: 0, fly: kind === 'witch', face: -1, mx: 0, my: 0, kvx: 0, kvy: 0, stun: 0, flash: 0, hurtT: 0, t: 0, pose: 'idle', z: 0, alpha: 1,
        armor: true, contactDmg: 0, dead: false, blocked: false, spawning: false, vulnMul: 1, invuln: true, solid: kind !== 'witch', untargetable: false, phase: 0, hidden: false, blood: ['#e8e0cc', '#b0a48a'] };
      if (kind === 'witch') e.blood = ['#7dff8a', '#2f5a3e']; if (kind === 'dragon') e.blood = ['#ff7a2a', '#ffd060']; if (kind === 'medusa') e.blood = ['#7dff4a', '#2f5a3e']; if (kind === 'cerberus') e.blood = ['#ff4a2a', '#ffd060']; if (kind === 'minotaur') e.blood = ['#c04a3a', '#8a5a3a']; if (kind === 'zeus') e.blood = ['#ffe84a', '#8ad8ff'];
      e.onDeath = G.onBossDeath;
      e.gen = (function* () { yield* intro(e); yield* LOOPS[kind](e); })();
      W.unstick(e); G.enemies.push(e); G.boss = e; return e;
    },
    checkPhase(e) {
      if (e.dead || e.invuln && e.phase >= 0 && e.t < 2.3) return;
      const th = C.BOSS[e.type].phases, r = e.hp / e.maxHp; let ph = 0; for (const t of th) if (r <= t) ph++;
      if (ph > e.phase) { e.phase = ph; e.mx = e.my = 0; e.hidden = false; e.untargetable = false; e.alpha = 1; e.z = 0; e.vulnMul = 1; e.stun = 0; e.gen = (function* () { yield* transition(e, TRANS[e.type][ph - 1], TCOL[e.type]); yield* LOOPS[e.type](e); })(); }
    },
    draw(ctx, e, time) {
      const f = Math.floor(e.t * 2.5) % 2, sp = S[e.type]; let spr;
      if (e.type === 'colossus') spr = e.pose === 'raise' ? sp.raise : e.pose === 'slam' ? sp.slam : e.pose === 'dizzy' ? sp.dizzy : sp.idle[f];
      else if (e.type === 'witch') spr = e.pose === 'cast' || e.pose === 'raise' ? sp.cast : sp.idle[f];
      else if (e.type === 'zeus') spr = e.pose === 'raise' ? sp.raise : e.pose === 'slam' ? sp.slam : e.pose === 'dizzy' ? sp.dizzy : sp.idle[f];
      else if (e.type === 'minotaur') spr = e.pose === 'raise' ? sp.raise : e.pose === 'slam' ? sp.slam : e.pose === 'dizzy' ? sp.dizzy : sp.idle[f];
      else if (e.type === 'cerberus') spr = e.pose === 'roar' || e.pose === 'raise' ? sp.roar : e.pose === 'slam' ? sp.bite : e.pose === 'dizzy' ? sp.dizzy : sp.idle[f];
      else if (e.type === 'medusa') spr = e.pose === 'cast' ? sp.cast : e.pose === 'dizzy' ? sp.dizzy : e.pose === 'slam' ? sp.slam : e.pose === 'raise' ? sp.raise : sp.idle[f];
      else spr = e.pose === 'roar' || e.pose === 'raise' ? sp.roar : e.pose === 'fly' ? sp.fly : sp.idle[f];
      const hover = e.type === 'witch' ? 8 + Math.sin(e.t * 3) * 3 : 0;
      ctx.globalAlpha = 0.35 * (e.hidden ? 1 : e.alpha); ctx.fillStyle = '#000'; const sw = Math.round(e.r * 1.4); ctx.fillRect(Math.round(e.x) - sw, Math.round(e.y) + 2, sw * 2, 3); ctx.fillRect(Math.round(e.x) - sw + 2, Math.round(e.y), sw * 2 - 4, 7); ctx.globalAlpha = 1;
      if (e.hidden) return;
      if (e.invuln && Math.floor(time * 10) % 2 === 0) ctx.globalAlpha = 0.7 * e.alpha;
      const flipDefault = e.type === 'colossus' || e.type === 'medusa' || e.type === 'cerberus' ? false : e.face < 0, shake = e.pose === 'raise' || e.pose === 'roar' ? Math.round(Math.sin(time * 60)) : 0;
      S.draw(ctx, spr, e.x + shake, e.y - hover, flipDefault, e.flash > 0, e.alpha); ctx.globalAlpha = 1;
      if (e.type === 'cerberus' && e.hg && !e.dead) { // mata/mulut kepala yang sedang menyerang menyala sesuai warna telegraph
        ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) if (e.hg[i]) { ctx.globalAlpha = 0.55 + 0.3 * Math.sin(time * 18 + i); ctx.drawImage(S.glow(HC[i], 14), hx(e, i) - 14, e.y - (i === 1 ? 45 : 39) - 14); } ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
      if (e.type === 'medusa' && e.gz && !e.dead) { // mata bercahaya + tanda seru saat tatapan disiapkan
        const g = e.gz, ca = Math.cos(g.a) * 1.5, sa = Math.sin(g.a) * 1; ctx.globalAlpha = g.st === 'on' ? 0.9 : 0.5 + 0.3 * Math.sin(time * 20); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(S.glow(g.st === 'on' ? '#c8ff4a' : '#ffe066', 10), e.x - 10 + ca - 3, e.y - 36 + sa - 10); ctx.drawImage(S.glow(g.st === 'on' ? '#c8ff4a' : '#ffe066', 10), e.x - 10 + ca + 3, e.y - 36 + sa - 10); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        if (g.st !== 'on' && Math.floor(time * 14) % 2 === 0) S.text(ctx, '!', e.x, e.y - 62, '#ffe066', 2, 'center');
      }
      if (e.type === 'zeus' && !e.dead && (e.pose === 'raise' || e.pose === 'slam')) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(time * 25); ctx.drawImage(S.glow(ZC, 16), e.x + (e.face < 0 ? -1 : 1) * 12 - 16, e.y - 54 - 16); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; }
      if (e.vulnMul > 1 && e.pose === 'dizzy') for (let i = 0; i < 3; i++) { const a = time * 5 + i * 2.1; S.text(ctx, '*', e.x + Math.cos(a) * 12, e.y - e.r * 3 + Math.sin(a) * 3 - 6, '#ffe066', 1, 'center'); }
    },
  };
})(window.PC);
