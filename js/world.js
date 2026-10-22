// Dunia: grid tile, tabrakan lingkaran-vs-tile, pre-render latar ruangan.
window.PC = window.PC || {};
(function (PC) {
  const C = PC.C, T = C.TILE, U = PC.U;
  const LAYOUTS = [
    [],
    [[6, 5], [6, 10], [19, 5], [19, 10]],
    [[11, 5], [14, 5], [11, 9], [14, 9]],
    [[8, 4], [8, 10], [16, 4], [16, 10], [12, 7]],
    [[4, 7], [21, 7], [10, 4], [15, 10], [12, 7]],
    [[8, 7], [9, 7], [16, 7], [17, 7]],
  ];
  const BOSS_LAYOUT = [[5, 4], [5, 10], [20, 4], [20, 10]];
  // Layout arena khusus per boss (kolom,baris). Medusa: pilar tersebar sebagai tempat berlindung dari tatapan.
  const BOSS_LAYOUTS = { medusa: [[8, 4], [8, 10], [12, 7], [16, 5], [16, 9]], cerberus: [[8, 5], [8, 9], [17, 5], [17, 9]],
    minotaur: [[7, 5], [7, 9], [12, 4], [12, 10], [16, 7], [21, 5], [21, 9]] };
  const DOOR_ROWS = [6, 7];

  const World = {
    room: null,
    make(theme, boss, kind) {
      const layout = boss ? (BOSS_LAYOUTS[kind] || BOSS_LAYOUT) : U.choice(LAYOUTS);
      const grid = [];
      for (let r = 0; r < C.ROWS; r++) { grid.push([]); for (let c = 0; c < C.COLS; c++) grid[r].push(r < 2 || r === C.ROWS - 1 || c === 0 || c === C.COLS - 1 ? 1 : 0); }
      const pillars = [];
      for (const [c, r] of layout) { grid[r][c] = 2; pillars.push({ x: c * T + 8, y: r * T + 16, c, r }); }
      const room = { theme, grid, pillars, doorOpen: false, doorX: (C.COLS - 1) * T, doorY: DOOR_ROWS[0] * T, torches: [], bg: null, boss: !!boss, bossKind: kind || null };
      for (const c of [3, 8, 13, 18, 22]) room.torches.push({ x: c * T + 8, y: T + 7, ph: Math.random() * 6 });
      room.bg = World.renderBg(room);
      World.room = room; return room;
    },
    setDoor(open) { const rm = World.room; rm.doorOpen = open; for (const r of DOOR_ROWS) rm.grid[r][C.COLS - 1] = open ? 0 : 1; },
    renderBg(room) {
      const th = PC.S.tiles[room.theme], cv = document.createElement('canvas'); cv.width = C.ROOM_W; cv.height = C.ROOM_H; const g = cv.getContext('2d');
      let s = 13; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let r = 0; r < C.ROWS; r++) for (let c = 0; c < C.COLS; c++) {
        let img;
        if (r === 0) img = th.wallTop; else if (r === 1) img = th.wallFace; else if (r === C.ROWS - 1) img = th.wallBottom;
        else if (c === 0 || c === C.COLS - 1) img = th.wallSide;
        else img = th.floor[Math.floor(rnd() * 4)];
        g.drawImage(img, c * T, r * T);
      }
      // dekorasi lantai
      const dec = (n, fn) => { for (let i = 0; i < n; i++) fn(T * 2 + rnd() * (C.ROOM_W - T * 4), T * 3 + rnd() * (C.ROOM_H - T * 5)); };
      dec(7, (x, y) => { g.fillStyle = room.theme === 'inferno' ? '#2a1420' : 'rgba(0,0,0,.18)'; g.fillRect(x | 0, y | 0, 3 + (rnd() * 5 | 0), 2); });
      dec(5, (x, y) => { g.fillStyle = '#d8d0b8'; g.fillRect(x | 0, y | 0, 5, 1); g.fillRect((x | 0) + 1, (y | 0) - 1, 1, 3); g.fillRect((x | 0) + 4, (y | 0) - 1, 1, 3); });
      dec(2, (x, y) => { g.fillStyle = '#e8e0cc'; g.fillRect(x | 0, y | 0, 5, 4); g.fillStyle = '#14101f'; g.fillRect((x | 0) + 1, (y | 0) + 1, 1, 1); g.fillRect((x | 0) + 3, (y | 0) + 1, 1, 1); });
      if (room.theme === 'temple') dec(5, (x, y) => { g.fillStyle = 'rgba(255,217,138,.35)'; g.fillRect(x | 0, y | 0, 3, 3); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect((x | 0) + 1, (y | 0) + 1, 1, 1); });
      if (room.theme === 'sky') dec(6, (x, y) => { g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x | 0, y | 0, 8, 2); g.fillRect((x | 0) + 2, (y | 0) - 1, 4, 1); });
      if (room.theme === 'maze') dec(5, (x, y) => { g.fillStyle = 'rgba(106,122,74,.45)'; g.fillRect(x | 0, y | 0, 5, 2); });
      if (room.theme === 'swamp') dec(6, (x, y) => { g.fillStyle = 'rgba(80,140,90,.45)'; g.fillRect(x | 0, y | 0, 6, 3); });
      if (room.theme === 'inferno' || room.theme === 'hell') dec(4, (x, y) => { g.fillStyle = '#ff6a2a'; g.fillRect(x | 0, y | 0, 4, 1); g.fillStyle = '#ffb060'; g.fillRect((x | 0) + 1, y | 0, 1, 1); });
      if (room.bossKind === 'medusa' && PC.S.statue) { [[36, 0], [96, 1], [172, 0], [254, 1], [330, 0]].forEach(([x, v]) => { const sp = PC.S.statue[v]; g.drawImage(sp.c, x - sp.ax, 47 - sp.ay); }); }
      // bayangan di bawah dinding & vignette sudut
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(T, 2 * T, C.ROOM_W - 2 * T, 5); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(T, 2 * T + 5, C.ROOM_W - 2 * T, 4);
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(T, 2 * T, 4, C.ROOM_H - 3 * T); g.fillRect(C.ROOM_W - T - 4, 2 * T, 4, C.ROOM_H - 3 * T);
      // braket obor
      for (const t of room.torches) { g.fillStyle = '#3a2a1a'; g.fillRect(t.x - 1, t.y + 2, 3, 6); g.fillStyle = '#6a6a7e'; g.fillRect(t.x - 3, t.y + 1, 7, 2); }
      return cv;
    },
    // ---- tabrakan ----
    solidTile(c, r) { const g = World.room.grid; return r < 0 || c < 0 || r >= C.ROWS || c >= C.COLS || g[r][c] !== 0; },
    solidAt(x, y) { return World.solidTile(Math.floor(x / T), Math.floor(y / T)); },
    hitsSolid(x, y, rad, ignorePillars) {
      const g = World.room.grid, c0 = Math.floor((x - rad) / T), c1 = Math.floor((x + rad) / T), r0 = Math.floor((y - rad) / T), r1 = Math.floor((y + rad) / T);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const v = (r < 0 || c < 0 || r >= C.ROWS || c >= C.COLS) ? 1 : g[r][c]; if (!v || (ignorePillars && v === 2)) continue;
        const nx = U.clamp(x, c * T, c * T + T), ny = U.clamp(y, r * T, r * T + T), dx = x - nx, dy = y - ny;
        if (dx * dx + dy * dy < rad * rad) return true;
      }
      return false;
    },
    // Gerak dengan sapuan per-sumbu. Mengembalikan {x:bool,y:bool} bila terhalang.
    move(e, dx, dy) {
      const ip = !!e.fly, rad = e.r, res = { x: false, y: false };
      const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 4) || 1, sx = dx / steps, sy = dy / steps;
      for (let i = 0; i < steps; i++) {
        if (sx) { if (World.hitsSolid(e.x + sx, e.y, rad, ip)) res.x = true; else e.x += sx; }
        if (sy) { if (World.hitsSolid(e.x, e.y + sy, rad, ip)) res.y = true; else e.y += sy; }
      }
      return res;
    },
    // Dorong keluar bila terjepit di dalam tile (mis. setelah spawn)
    unstick(e) {
      for (let i = 0; i < 12 && World.hitsSolid(e.x, e.y, e.r, !!e.fly); i++) { const cx = C.ROOM_W / 2, cy = C.ROOM_H / 2, a = U.angle(e.x, e.y, cx, cy); e.x += Math.cos(a) * 2; e.y += Math.sin(a) * 2; }
    },
    inBounds(x, y, m) { return x > T + m && x < C.ROOM_W - T - m && y > 2 * T + m && y < C.ROOM_H - T - m; },
    randomFree(rad, avoid, minD, tries) {
      for (let i = 0; i < (tries || 40); i++) {
        const x = U.rand(T + 14, C.ROOM_W - T - 14), y = U.rand(2 * T + 12, C.ROOM_H - T - 12);
        if (World.hitsSolid(x, y, rad + 2)) continue;
        if (avoid && U.dist(x, y, avoid.x, avoid.y) < minD) continue;
        return { x, y };
      }
      return { x: C.ROOM_W / 2, y: C.ROOM_H / 2 };
    },
    // Raycast garis sederhana: kembalikan titik berhenti sebelum tembok (untuk charge)
    rayEnd(x, y, a, maxLen, rad) {
      const cx = Math.cos(a), cy = Math.sin(a); let d = 0;
      while (d < maxLen) { if (World.hitsSolid(x + cx * (d + 3), y + cy * (d + 3), rad)) break; d += 3; }
      return d;
    },
    drawDoor(ctx) {
      const rm = World.room, spr = PC.S.door[rm.theme][rm.doorOpen ? 'open' : 'closed'];
      PC.S.draw(ctx, spr, rm.doorX, rm.doorY + 31 + 1);
    },
    drawTorches(ctx, time) {
      const rm = World.room;
      for (const t of rm.torches) {
        const f = Math.floor((time * 9 + t.ph) % 3), x = t.x, y = t.y;
        ctx.fillStyle = '#ff7a2a'; ctx.fillRect(x - 1, y - 3 - (f === 1 ? 1 : 0), 3, 4); ctx.fillStyle = '#ffd060'; ctx.fillRect(x, y - 2 - (f === 2 ? 1 : 0), 1, 3); ctx.fillStyle = '#fff3b0'; ctx.fillRect(x, y, 1, 1);
        ctx.globalAlpha = 0.28 + 0.06 * Math.sin(time * 7 + t.ph); ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(PC.S.glow(PC.S.THEMES[rm.theme].glow === '#ff8a4a' ? '#ff7a30' : '#ff9a50', 28), x - 28, y - 22 + 14); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
    },
  };
  PC.World = World;
})(window.PC);
