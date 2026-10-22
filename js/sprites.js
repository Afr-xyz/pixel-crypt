// Pixel art prosedural: semua sprite digambar lewat kode (tanpa file gambar).
window.PC = window.PC || {};
(function (PC) {
  const U = PC.U;

  // ---------- Painter ----------
  class Pix {
    constructor(w, h) {
      this.w = w + 2; this.h = h + 2;
      this.c = document.createElement('canvas'); this.c.width = this.w; this.c.height = this.h;
      this.x = this.c.getContext('2d');
    }
    p(x, y, col) { this.x.fillStyle = col; this.x.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1); }
    r(x, y, w, h, col) { this.x.fillStyle = col; this.x.fillRect(Math.round(x) + 1, Math.round(y) + 1, w, h); }
    ell(cx, cy, rx, ry, col) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.p(x, y, col);
      }
    }
    line(x0, y0, x1, y1, col) {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
      for (;;) { this.p(x0, y0, col); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
    }
    poly(pts, col) {
      let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9;
      for (const [x, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
      for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
        const px = x + 0.5, py = y + 0.5; let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.p(x, y, col);
      }
    }
    // Sinar tepi atas & bayangan bawah otomatis, lalu kontur gelap
    finish(ax, ay, o = {}) {
      const { w, h } = this, ctx = this.x, id = ctx.getImageData(0, 0, w, h), d = id.data;
      const A = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? 0 : d[(y * w + x) * 4 + 3];
      const out = new Uint8ClampedArray(d);
      if (o.shade !== false) {
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4; if (d[i + 3] === 0) continue;
          const top = A(x, y - 1) === 0, bot = A(x, y + 1) === 0;
          if (top || bot) {
            const k = top ? 0.22 : -0.28, t = k < 0 ? 0 : 255, a = Math.abs(k);
            for (let c = 0; c < 3; c++) out[i + c] = d[i + c] + (t - d[i + c]) * a;
          }
        }
      }
      const ol = U.hex2rgb(o.outline || '#14101f');
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4; if (d[i + 3] !== 0) continue;
        if (A(x - 1, y) || A(x + 1, y) || A(x, y - 1) || A(x, y + 1)) { out[i] = ol[0]; out[i + 1] = ol[1]; out[i + 2] = ol[2]; out[i + 3] = 255; }
      }
      id.data.set(out); ctx.putImageData(id, 0, 0);
      const spr = { c: this.c, w, h, ax: ax + 1, ay: ay + 1, _fl: null,
        fl() { if (!this._fl) { const f = document.createElement('canvas'); f.width = w; f.height = h; const g = f.getContext('2d'); g.drawImage(this.c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#fff'; g.globalAlpha = 0.85; g.fillRect(0, 0, w, h); this._fl = f; } return this._fl; } };
      return spr;
    }
  }

  const K = {
    skin: '#f0b98d', steel: '#c8d0e0', steelD: '#8a95b0', steelL: '#eef3ff', blue: '#3f6fe0', blueD: '#2a4aa8',
    red: '#d9413f', redD: '#8f2433', gold: '#f3c53c', brown: '#8a5a2b', brownD: '#5a3a1f',
    green: '#52c25a', greenD: '#2f8a45', greenL: '#9af08a', purple: '#7a4cc8', purpleD: '#4a2a8a', purpleL: '#b58cff',
    bone: '#e8e0cc', boneD: '#b0a48a', dark: '#1a1426', cyan: '#5ee6ff', orange: '#ff8a2a', yellow: '#ffe066',
  };

  const S = { K, Pix };

  // ---------- Pahlawan ----------
  function hero(leg, bob) {
    const P = new Pix(18, 22), by = bob ? 1 : 0, pant = '#3b3b5c', boot = '#2a2a40';
    if (leg === 0) { P.r(5, 16, 3, 4, pant); P.r(10, 16, 3, 4, pant); P.r(5, 20, 3, 2, boot); P.r(10, 20, 3, 2, boot); }
    else if (leg === 1) { P.r(4, 16, 3, 4, pant); P.r(4, 19, 3, 2, boot); P.r(11, 16, 3, 3, pant); P.r(11, 18, 3, 2, boot); }
    else { P.r(6, 16, 3, 3, pant); P.r(6, 18, 3, 2, boot); P.r(9, 16, 3, 4, pant); P.r(9, 19, 4, 2, boot); }
    P.r(5, 9 + by, 8, 7, K.blue); P.r(5, 14 + by, 8, 1, K.brown); P.r(8, 14 + by, 2, 1, K.gold);
    P.r(7, 10 + by, 4, 3, '#5f8fff');
    P.r(3, 9 + by, 3, 3, K.steel); P.r(12, 9 + by, 3, 3, K.steel);
    P.r(12, 11 + by, 3, 3, K.steelD);
    P.ell(9, 6 + by, 4.5, 4.2, K.steel); P.r(9, 6 + by, 5, 2, K.dark); P.r(10, 6 + by, 2, 1, K.cyan);
    P.r(5, 1 + by, 4, 2, K.red); P.r(3, 2 + by, 3, 3, K.red); P.r(2, 4 + by, 2, 2, K.redD);
    P.r(14, 4 + by, 2, 10, K.steelL); P.p(14, 3 + by, K.steelL); P.r(13, 13 + by, 4, 1, K.gold); P.r(14, 14 + by, 2, 2, K.brown);
    return P.finish(9, 21);
  }

  // ---------- Musuh ----------
  function slime(pose) {
    const P = new Pix(16, 12);
    const [cy, rx, ry] = pose === 1 ? [8, 8, 4] : pose === 2 ? [6, 5.5, 6] : [7, 7, 5];
    P.ell(8, cy, rx, ry, K.green); P.ell(8, cy + 1, rx - 1, ry - 1, '#6ee07a'); P.r(5, cy - ry + 2, 3, 1, '#d6ffd0'); P.r(5, cy - 1, 2, 2, K.dark); P.r(9, cy - 1, 2, 2, K.dark);
    return P.finish(8, 11);
  }
  function skeleton(f, pose, hood) {
    const P = new Pix(18, 22), s = f ? 1 : 0, c = K.bone;
    P.r(6, 15, 2, 6 - s, c); P.r(10, 15, 2, 5 + s, c); P.r(5, 20 - s, 4, 1, K.boneD); P.r(9, 20 + s - 1, 4, 1, K.boneD);
    P.r(8, 9, 2, 6, K.boneD); P.r(5, 10, 8, 1, c); P.r(5, 12, 8, 1, c); P.r(6, 14, 6, 1, c);
    P.ell(9, 5, 4.2, 4, c); P.r(7, 4, 2, 2, K.dark); P.r(10, 4, 2, 2, K.dark); P.r(7, 8, 5, 2, c); P.p(8, 9, K.dark); P.p(10, 9, K.dark);
    if (hood) { P.ell(9, 4, 5, 4.5, '#3a5a3a'); P.r(6, 5, 7, 3, K.dark); P.p(8, 6, '#ffd24a'); P.p(11, 6, '#ffd24a'); P.r(5, 8, 8, 4, '#3a5a3a'); P.r(14, 3, 1, 14, K.brown); P.line(14, 3, 16, 5, K.brown); P.line(14, 17, 16, 15, K.brown); P.line(16, 5, 16, 15, '#e8e0cc'); }
    else if (pose === 1) { P.r(12, 9, 2, 3, c); P.r(13, 0, 2, 11, K.steel); P.r(12, 10, 4, 1, K.gold); }
    else { P.r(12, 10, 2, 3, c); P.r(14, 7, 2, 10, K.steel); P.r(13, 16, 4, 1, K.gold); }
    return P.finish(9, 21);
  }
  function bat(f) {
    const P = new Pix(18, 12), c = '#4a3a6a', w = '#6a4a9a';
    if (f) { P.poly([[8, 5], [1, 9], [3, 5], [5, 7]], w); P.poly([[10, 5], [17, 9], [15, 5], [13, 7]], w); }
    else { P.poly([[8, 5], [1, 1], [4, 6], [5, 5]], w); P.poly([[10, 5], [17, 1], [14, 6], [13, 5]], w); }
    P.ell(9, 6, 3, 3.5, c); P.p(7, 3, c); P.p(11, 3, c); P.p(8, 5, '#ff4a4a'); P.p(10, 5, '#ff4a4a');
    return P.finish(9, 8);
  }
  function ghoul(f, pose) {
    const P = new Pix(22, 22), c = '#6b7a5a', d = '#4a5a40', s = f ? 1 : 0;
    P.r(6, 16, 3, 5 - s, d); P.r(12, 16, 3, 4 + s, d);
    P.ell(10, 12, 6.5, 6, c); P.ell(10, 13, 4.5, 4, '#8a9a76');
    P.ell(14, 6, 4, 3.5, c); P.r(15, 5, 2, 2, '#ff4a4a'); P.r(14, 9, 4, 1, K.bone); P.p(14, 9, K.dark);
    if (pose === 1) { P.r(15, 1, 4, 3, c); P.r(18, -0, 3, 8, c); P.p(20, 8, K.bone); P.p(19, 9, K.bone); } else { P.r(16, 11, 5, 2, c); P.p(21, 11, K.bone); P.p(21, 13, K.bone); }
    P.r(2, 9, 3, 6, d);
    return P.finish(11, 21);
  }
  function mage(f, pose) {
    const P = new Pix(18, 24), b = f ? 1 : 0;
    for (let y = 9; y < 23; y++) { const w = 3 + Math.floor((y - 9) * 0.45); P.r(8 - w, y, w * 2, 1, y % 5 === 0 ? K.purpleD : K.purple); }
    P.ell(8, 6 + b, 4.5, 4.5, K.purpleD); P.r(6, 6 + b, 5, 3, K.dark); P.p(7, 7 + b, K.yellow); P.p(10, 7 + b, K.yellow);
    P.r(14, 4, 1, 18, K.brown); P.ell(14.5, 3, 2.3, 2.3, pose ? '#ffffff' : K.cyan); P.p(14, 3, '#ffffff');
    if (pose) P.r(10, 8, 4, 2, K.purpleL);
    return P.finish(8, 23);
  }
  function knight(f, pose) {
    const P = new Pix(24, 26), s = f ? 1 : 0, a = '#4a4a68', l = '#6a6a8e';
    P.r(8, 19, 4, 6 - s, a); P.r(13, 19, 4, 5 + s, a);
    P.ell(12, 14, 7, 7, a); P.ell(12, 13, 5, 5, l);
    P.ell(12, 6, 5, 5, l); P.r(12, 5, 5, 2, '#ff3b3b'); P.r(10, 0, 4, 2, K.red);
    P.r(0, 10, 8, 12, '#3a3a58'); P.r(1, 11, 6, 10, '#5a5a80'); P.r(3, 14, 2, 4, K.red); P.r(2, 15, 4, 2, K.red);
    if (pose === 1) { P.r(17, -3, 3, 16, K.steelL); P.r(15, 12, 7, 1, K.gold); } else { P.r(18, 6, 3, 14, K.steelL); P.r(16, 18, 7, 1, K.gold); }
    return P.finish(12, 25);
  }
  function imp(f) {
    const P = new Pix(16, 16), c = '#d9413f', d = '#8f2433';
    P.poly([[3, 7], [0, 2 + f * 2], [5, 5]], d); P.poly([[11, 7], [14, 2 + f * 2], [9, 5]], d);
    P.ell(7, 10, 3.5, 4, c); P.ell(7, 5, 3.5, 3.2, c); P.p(4, 1, '#ffe9c0'); P.p(10, 1, '#ffe9c0'); P.p(4, 2, '#ffe9c0'); P.p(10, 2, '#ffe9c0');
    P.p(5, 5, K.yellow); P.p(9, 5, K.yellow); P.r(6, 7, 3, 1, K.dark);
    P.r(5, 13, 2, 2 - f, d); P.r(8, 13, 2, 1 + f, d); P.line(10, 12, 13, 10 + f, d);
    return P.finish(7, 15);
  }

  // ---------- Boss ----------
  function colossus(pose, f) {
    const P = new Pix(52, 50), c = K.bone, d = K.boneD, dd = '#7d7360', bob = f ? 1 : 0;
    const dy = pose === 'slam' ? 3 : 0;
    // kaki
    P.r(14, 36 + dy, 8, 12 - dy, c); P.r(30, 36 + dy, 8, 12 - dy, c); P.r(11, 46, 12, 3, d); P.r(29, 46, 12, 3, d);
    P.r(17, 33 + dy, 18, 5, d);
    // tulang rusuk
    P.ell(26, 24 + dy + bob, 12, 11, dd); P.ell(26, 24 + dy + bob, 10.5, 9.5, c);
    for (let i = 0; i < 4; i++) P.r(17, 19 + dy + bob + i * 4, 18, 1, dd); P.r(25, 14 + dy + bob, 2, 20, dd);
    // bahu & lengan
    const raise = pose === 'raise';
    P.ell(10, 17 + dy + bob, 5, 5, d); P.ell(42, 17 + dy + bob, 5, 5, d);
    if (raise) { P.r(5, 2, 6, 15, c); P.r(41, 2, 6, 15, c); P.ell(8, 2, 5, 4, d); P.ell(44, 2, 5, 4, d); }
    else if (pose === 'slam') { P.r(4, 20 + dy, 7, 16, c); P.r(41, 20 + dy, 7, 16, c); P.ell(7, 38 + dy, 6, 5, d); P.ell(45, 38 + dy, 6, 5, d); }
    else { P.r(5, 19 + bob, 6, 17, c); P.r(41, 19 + bob, 6, 17, c); P.ell(8, 38, 5.5, 5, d); P.ell(44, 38, 5.5, 5, d); }
    // tengkorak & tanduk
    P.ell(26, 9 + dy + bob, 9, 8, c); P.r(19, 14 + dy + bob, 14, 4, c);
    P.poly([[18, 6 + dy], [11, -1], [16, 8 + dy]], d); P.poly([[34, 6 + dy], [41, -1], [36, 8 + dy]], d);
    const eye = pose === 'dizzy' ? '#ffe066' : '#ff3b3b';
    P.r(20, 7 + dy + bob, 4, 4, K.dark); P.r(28, 7 + dy + bob, 4, 4, K.dark); P.r(21, 8 + dy + bob, 2, 2, eye); P.r(29, 8 + dy + bob, 2, 2, eye);
    for (let i = 0; i < 5; i++) P.r(20 + i * 3, 15 + dy + bob, 1, 2, dd);
    return P.finish(26, 49);
  }
  function witch(pose, f) {
    const P = new Pix(30, 38), bob = f ? 1 : 0, glow = '#7dff8a';
    for (let y = 14; y < 36; y++) { const w = 4 + Math.floor((y - 14) * 0.55); P.r(15 - w, y + bob, w * 2, 1, y % 6 === 0 ? '#1e3a2a' : '#2f5a3e'); }
    for (let i = 0; i < 5; i++) P.poly([[4 + i * 5, 34 + bob], [6 + i * 5, 37 + bob], [8 + i * 5, 34 + bob]], '#1e3a2a');
    P.ell(15, 9 + bob, 6, 6.5, '#1e3a2a'); P.ell(15, 10 + bob, 4.2, 4.5, K.dark); P.p(13, 10 + bob, glow); P.p(14, 10 + bob, glow); P.p(17, 10 + bob, glow); P.p(18, 10 + bob, glow);
    P.poly([[15, -2 + bob], [10, 6 + bob], [20, 6 + bob]], '#1e3a2a'); P.r(9, 6 + bob, 12, 2, '#3a5a2a');
    P.r(10, 17 + bob, 10, 4, '#3a7a4a');
    if (pose === 'cast') { P.r(4, 10 + bob, 3, 8, '#3a7a4a'); P.r(23, 10 + bob, 3, 8, '#3a7a4a'); P.ell(5, 8 + bob, 3, 3, glow); P.ell(24, 8 + bob, 3, 3, glow); }
    else { P.r(23, 3 + bob, 1, 25, K.brown); P.ell(23.5, 3 + bob, 3, 3, K.bone); P.p(22, 3 + bob, K.dark); P.p(24, 3 + bob, K.dark); P.r(21, 16 + bob, 3, 3, '#3a7a4a'); }
    return P.finish(15, 37);
  }
  function dragon(pose, f) {
    const P = new Pix(64, 52), body = '#b8362f', dark = '#7a1f2a', belly = '#f0a050', wing = '#8a2a3a';
    const fl = pose === 'fly';
    // sayap
    const wy = f ? -4 : 0;
    P.poly([[22, 24], [12, 6 + wy], [24, 10 + wy], [30, 22]], wing); P.poly([[28, 22], [20, 2 + wy], [34, 8 + wy], [38, 22]], '#a03545');
    P.line(22, 24, 12, 6 + wy, dark); P.line(28, 22, 20, 2 + wy, dark);
    // ekor
    P.poly([[14, 34], [0, 40], [3, 42], [18, 40]], body); P.poly([[0, 40], [-1, 36], [4, 41]], K.yellow);
    // badan, kaki
    P.r(18, 38, 6, 11, dark); P.r(32, 38, 6, 11, dark); P.r(15, 47, 10, 3, '#3a1018'); P.r(30, 47, 10, 3, '#3a1018');
    P.ell(28, 32, 15, 10, body); P.ell(28, 36, 11, 6, belly);
    for (let i = 0; i < 5; i++) P.r(20 + i * 4, 35 + (i % 2), 3, 1, '#c97a38');
    // leher & kepala
    const ho = pose === 'roar' ? -5 : 0;
    P.poly([[36, 28], [44, 14 + ho], [50, 18 + ho], [42, 32]], body);
    P.ell(48, 14 + ho, 8, 6, body); P.poly([[52, 12 + ho], [63, 15 + ho], [62, 20 + ho], [52, 20 + ho]], body);
    if (pose === 'roar') { P.r(52, 20 + ho, 11, 4, '#5a0f18'); P.r(54, 20 + ho, 2, 2, K.bone); P.r(59, 20 + ho, 2, 2, K.bone); P.r(56, 21 + ho, 6, 2, '#ff8a2a'); }
    else P.r(53, 20 + ho, 9, 1, dark);
    P.poly([[44, 9 + ho], [40, 0 + ho], [48, 8 + ho]], K.bone); P.poly([[50, 8 + ho], [50, -1 + ho], [54, 9 + ho]], K.bone);
    P.r(51, 11 + ho, 3, 2, K.yellow); P.p(52, 12 + ho, K.dark);
    return P.finish(30, 50);
  }


  // Medusa (CP2): tubuh ular, rambut ular, mata emas. pose: idle | cast (tatapan) | dizzy (mata terpejam, rentan) | slam (ekor) | raise (tangan terangkat)
  function medusa(pose, f) {
    const P = new Pix(44, 52), skin = '#6fbf78', skinD = '#3f8a52', tail = '#2f6a3e', tailL = '#4a9a56', gold = '#e0a83c', hair = '#3f8a4a', hairD = '#23552e';
    const bob = f ? 1 : 0, droop = pose === 'dizzy', up = pose === 'raise' || pose === 'cast';
    // ekor melingkar
    P.ell(22, 46, 16, 5, tail); P.ell(22, 43, 12, 5, tailL); P.ell(22, 40, 8, 4, tail);
    for (let i = 0; i < 7; i++) P.r(8 + i * 4, 44 + (i % 2), 2, 1, hairD);
    if (pose === 'slam') { P.poly([[34, 44], [41, 30], [44, 32], [40, 46]], tail); P.ell(42, 30, 3, 3, tailL); }
    else P.poly([[34, 46], [41, 44 + bob], [43, 48], [36, 50]], tail);
    // badan
    for (let y = 22; y < 40; y++) { const w = 6 + Math.floor((y - 22) * 0.18); P.r(22 - w, y, w * 2, 1, y % 5 === 0 ? skinD : skin); }
    P.r(15, 24, 14, 5, gold); P.r(15, 24, 14, 1, '#ffe066'); P.r(21, 27, 2, 2, '#c03a3a');
    // lengan
    if (up) { P.r(10, 11 + bob, 4, 14, skin); P.r(30, 11 + bob, 4, 14, skin); P.ell(12, 10 + bob, 3, 3, skinD); P.ell(32, 10 + bob, 3, 3, skinD); }
    else { P.r(11, 24, 4, 12 + bob, skin); P.r(29, 24, 4, 12 + bob, skin); P.ell(13, 37 + bob, 2.5, 2.5, skinD); P.ell(31, 37 + bob, 2.5, 2.5, skinD); }
    // kepala
    P.ell(22, 15, 7, 7.5, skin); P.r(15, 12, 14, 2, hair);
    // rambut ular
    for (let i = -3; i <= 3; i++) {
      const sx = 22 + i * 2, w = (i + f * 2 + 6) % 3 - 1;
      if (droop) { P.line(sx, 9, 22 + i * 4, 20 + Math.abs(i)); P.p(22 + i * 4, 21 + Math.abs(i), hair); P.p(22 + i * 4, 22 + Math.abs(i), '#ffe066'); }
      else { P.line(sx, 9, 22 + i * 5 + w, 2 - Math.abs(i) / 2 + bob); P.p(22 + i * 5 + w, 1 - Math.abs(i) / 2 + bob, hair); P.p(22 + i * 5 + w + (i < 0 ? -1 : 1), 1 - Math.abs(i) / 2 + bob, '#ffe066'); }
    }
    // wajah
    if (droop) { P.r(18, 15, 3, 1, '#14101f'); P.r(24, 15, 3, 1, '#14101f'); }
    else if (pose === 'cast') { P.r(17, 13, 5, 4, '#fff6a0'); P.r(23, 13, 5, 4, '#fff6a0'); P.r(19, 14, 2, 2, '#ff8a2a'); P.r(25, 14, 2, 2, '#ff8a2a'); }
    else { P.r(18, 14, 3, 2, '#ffe066'); P.r(24, 14, 3, 2, '#ffe066'); P.p(19, 15, '#14101f'); P.p(25, 15, '#14101f'); }
    P.r(20, 19, 5, 1, '#14101f'); if (pose === 'cast') P.r(21, 20, 3, 1, '#14101f');
    return P.finish(22, 51);
  }
  // Patung korban tatapan Medusa (dekorasi arena)
  function statue(v) {
    const P = new Pix(14, 28), s = '#8a90a2', d = '#5e6478', l = '#b4bacb';
    P.r(1, 24, 12, 3, d); P.r(3, 23, 8, 2, s);
    P.r(4, 12, 6, 12, s); P.r(4, 12, 2, 12, l); P.r(8, 12, 2, 12, d);
    if (v) { P.r(1, 3, 3, 10, s); P.r(10, 8, 3, 6, s); } else { P.r(2, 12, 3, 8, s); P.r(9, 4, 3, 9, s); }
    P.ell(7, 8, 3.5, 4, s); P.r(5, 6, 2, 3, l); P.r(6, 8, 1, 2, d); P.r(8, 8, 1, 2, d); P.r(6, 11, 3, 1, d);
    P.r(5, 16, 1, 5, d); P.r(8, 19, 1, 4, d); // retakan
    return P.finish(7, 26, { shade: false });
  }


  // Cerberus (CP3): anjing neraka 3 kepala. Kepala: kiri=Api (oranye), tengah=Taring (merah), kanan=Roh (biru). pose: idle | roar | bite | dizzy
  function cerberus(pose, f) {
    const P = new Pix(60, 54), fur = '#3a2a2e', furD = '#1a1012', furL = '#5a3a3e', chain = '#8a90a2', bob = f ? 1 : 0, low = pose === 'dizzy';
    P.r(10, 38, 8, 14, furD); P.r(40, 38, 8, 14, furD); P.r(20, 40, 7, 12, fur); P.r(32, 40, 7, 12, fur);
    P.r(8, 50, 11, 3, '#0e0709'); P.r(39, 50, 11, 3, '#0e0709'); P.r(19, 50, 9, 3, '#0e0709'); P.r(31, 50, 9, 3, '#0e0709');
    P.ell(30, 34, 20, 11, fur); P.ell(30, 36, 14, 6, furL); P.poly([[48, 30], [58, 22 + bob], [56, 34]], furD);
    for (let i = 0; i < 6; i++) P.r(14 + i * 6, 28, 2, 3, furL);
    const head = (cx, cy, eye, open) => {
      P.r(cx - 2, cy + 4, 4, 12 - (low ? 3 : 0), fur); for (let k = 0; k < 4; k++) P.r(cx - 3 + (k % 2) * 4, cy + 6 + k * 2, 2, 1, chain);
      P.ell(cx, cy, 6.5, 5.5, fur); P.r(cx - 4, cy + 1, 8, 5, furL); P.poly([[cx - 6, cy - 3], [cx - 9, cy - 9], [cx - 3, cy - 5]], furD); P.poly([[cx + 6, cy - 3], [cx + 9, cy - 9], [cx + 3, cy - 5]], furD);
      if (low) { P.r(cx - 4, cy - 1, 3, 1, '#14101f'); P.r(cx + 1, cy - 1, 3, 1, '#14101f'); P.r(cx - 1, cy + 4, 3, 3, '#ff6a8a'); }
      else { P.r(cx - 4, cy - 2, 3, 2, eye); P.r(cx + 1, cy - 2, 3, 2, eye); if (open) { P.r(cx - 3, cy + 3, 7, 3, '#5a0f18'); P.r(cx - 3, cy + 3, 1, 2, '#fff'); P.r(cx + 3, cy + 3, 1, 2, '#fff'); } else P.r(cx - 3, cy + 4, 7, 1, '#14101f'); }
    };
    const up = pose === 'roar' ? -4 : 0, hy = low ? 12 : 0;
    head(15, 14 + bob + up + hy, '#ff9a2a', pose === 'roar'); head(45, 14 + bob + up + hy, '#7ac8ff', pose === 'roar');
    head(30, (pose === 'bite' ? 12 : 8) + bob + up + hy, '#ff3b3b', pose === 'roar' || pose === 'bite');
    return P.finish(30, 53);
  }


  // Minotaur (CP4): banteng bipedal menghadap KANAN (di-flip bila face<0). pose: idle | raise (menggaruk tanah/siap) | slam (seruduk/pukul) | dizzy (pusing)
  function minotaur(pose, f) {
    const P = new Pix(52, 56), skin = '#a87048', fur = '#6a4228', furD = '#40281a', bone = '#e8e0cc', bob = f ? 1 : 0, low = pose === 'slam' || pose === 'dizzy', lean = pose === 'slam' ? 4 : 0;
    P.r(14, 40, 8, 14, furD); P.r(28, 40, 8, 14, fur); P.r(12, 52, 11, 3, '#1a1010'); P.r(26, 52, 11, 3, '#1a1010');
    if (pose === 'raise') P.r(30, 36, 8, 9, fur);
    P.ell(24 + lean, 30 + bob, 14, 13, skin); P.ell(24 + lean, 32 + bob, 10, 8, fur); P.r(14 + lean, 40, 20, 4, '#8a2a2a'); P.r(14 + lean, 40, 20, 1, '#e0a83c');
    const hx = 34 + lean, hy = (low ? 20 : 14) + bob + (pose === 'dizzy' ? 4 : 0);
    P.r(8 + lean, 22 + bob, 6, 14, skin); P.ell(10 + lean, 36 + bob, 4, 4, skinD());
    if (pose === 'slam') { P.r(36 + lean, 24, 12, 7, skin); P.ell(49 + lean, 27, 4, 4, skinD()); } else if (pose === 'raise') { P.r(34 + lean, 8, 6, 18, skin); P.ell(37 + lean, 7, 4, 4, skinD()); } else { P.r(34 + lean, 24 + bob, 6, 14, skin); P.ell(37 + lean, 38 + bob, 4, 4, skinD()); }
    P.ell(hx, hy, 9, 8, fur); P.r(hx + 2, hy + 1, 10, 7, fur); P.r(hx + 8, hy + 2, 6, 4, '#c89a7a'); P.r(hx + 11, hy + 4, 3, 3, '#e0a83c');
    P.poly([[hx - 6, hy - 4], [hx - 10, hy - 12], [hx - 2, hy - 6]], bone); P.poly([[hx + 4, hy - 5], [hx + 12 + (low ? 4 : 0), hy - 11 + (low ? 6 : 0)], [hx + 8, hy - 3]], bone);
    if (pose === 'dizzy') { P.r(hx + 1, hy - 1, 3, 1, '#14101f'); P.r(hx + 6, hy - 1, 3, 1, '#14101f'); } else { P.r(hx + 1, hy - 2, 3, 2, '#ff3b3b'); P.r(hx + 6, hy - 2, 3, 2, '#ff3b3b'); }
    return P.finish(24, 55);
    function skinD() { return '#7a4a2a'; }
  }

  function zeus(pose, f) {
    const P = new Pix(52, 60), bob = f ? 1 : 0, robe = '#dfe6ff', robeD = '#9aa6d8', gold = '#ffe84a', skin = '#f0d0b0', up = pose === 'raise', fwd = pose === 'slam', low = pose === 'dizzy', hy = 12 + bob + (low ? 5 : 0);
    P.poly([[14, 26], [34, 26], [42, 57], [6, 57]], robe); P.poly([[28, 26], [34, 26], [42, 57], [30, 57]], robeD); P.r(7, 54, 34, 3, gold);
    P.ell(24, 27 + bob, 11, 10, robe); P.r(13, 22 + bob, 22, 3, gold); P.r(15, 36, 18, 2, gold); P.p(24, 37, '#4ac8ff');
    P.r(10, 30 + bob, 5, 14, robe); P.ell(12, 45, 3, 3, skin);
    if (up) { P.r(34, 8, 5, 20, robe); P.ell(36, 7, 3, 3, skin); } else if (fwd) { P.r(34, 26, 12, 5, robe); P.ell(47, 28, 3, 3, skin); } else { P.r(34, 28 + bob, 5, 15, robe); P.ell(36, 45 + bob, 3, 3, skin); }
    const bx = up ? 36 : fwd ? 48 : 36, by = up ? 0 : fwd ? 22 : 38 + bob;
    P.poly([[bx + 1, by - 2], [bx + 5, by + 5], [bx + 2, by + 5], [bx + 6, by + 14], [bx - 3, by + 6], [bx, by + 6]], gold); P.p(bx + 2, by + 4, '#fff');
    P.ell(24, hy, 9, 9, skin); P.ell(24, hy - 5, 10, 6, '#fff'); P.poly([[15, hy + 2], [33, hy + 2], [29, hy + 20], [24, hy + 24], [19, hy + 20]], '#fff'); P.poly([[24, hy + 8], [24, hy + 22], [29, hy + 20]], '#d8dcf0');
    P.r(16, hy - 10, 16, 2, gold); P.r(16, hy - 14, 3, 4, gold); P.r(22, hy - 15, 4, 5, gold); P.r(29, hy - 14, 3, 4, gold);
    if (low) { P.r(19, hy - 1, 4, 1, '#4ac8ff'); P.r(26, hy - 1, 4, 1, '#4ac8ff'); } else { P.r(19, hy - 2, 4, 2, '#4ac8ff'); P.r(26, hy - 2, 4, 2, '#4ac8ff'); P.p(20, hy - 2, '#fff'); P.p(27, hy - 2, '#fff'); }
    return P.finish(24, 58);
  }

  // Sprite boss SEMENTARA (CP1) untuk boss 4-7; diganti sprite asli di CP2-CP5.
  function pboss(body, dark, accent) {
    const P = new Pix(40, 46);
    P.ell(20, 32, 13, 12, body); P.ell(20, 14, 9, 9, body); P.r(10, 38, 6, 7, dark); P.r(24, 38, 6, 7, dark);
    P.r(14, 24, 12, 2, dark); P.p(16, 13, accent); P.p(17, 13, accent); P.p(23, 13, accent); P.p(24, 13, accent); P.r(17, 18, 6, 1, dark);
    return P.finish(20, 44);
  }
  function placeholderBoss(body, dark, accent) { const a = pboss(body, dark, accent), b = pboss(body, dark, accent); return { idle: [a, b], roar: a, fly: a, cast: a, raise: a, slam: a, dizzy: a }; }

  // ---------- Pickup & properti ----------
  function coin(f) { const P = new Pix(6, 6); P.ell(3, 3, f ? 1.4 : 2.8, 2.8, K.gold); P.p(2, 2, '#fff3a0'); return P.finish(3, 5); }
  function heart() { const P = new Pix(10, 9); P.ell(3, 3, 2.6, 2.6, K.red); P.ell(7, 3, 2.6, 2.6, K.red); P.poly([[0.5, 4], [9.5, 4], [5, 9]], K.red); P.p(2, 2, '#ffb0b0'); return P.finish(5, 8); }
  function orb() { const P = new Pix(10, 10); P.ell(5, 5, 4, 4, '#2a7aff'); P.ell(5, 5, 2.4, 2.4, K.cyan); P.p(4, 4, '#fff'); return P.finish(5, 9); }
  function potionSpr() { const P = new Pix(10, 12); P.r(4, 0, 2, 3, K.brown); P.ell(5, 7, 4, 4, '#e03a5a'); P.r(2, 6, 6, 1, '#ff9aaa'); return P.finish(5, 11); }
  function pillar(th) {
    const T = THEMES[th], P = new Pix(16, 28);
    P.r(2, 22, 12, 5, T.wallDark); P.r(3, 6, 10, 17, T.wallFace); P.r(3, 6, 3, 17, T.wallHi); P.r(10, 6, 3, 17, T.wallDark);
    P.r(1, 2, 14, 5, T.wallHi); P.r(1, 5, 14, 2, T.wallDark);
    for (let y = 9; y < 21; y += 4) P.r(3, y, 10, 1, T.wallDark);
    return P.finish(8, 27, { shade: false });
  }

  // ---------- Tema & tile ----------
  const THEMES = {
    crypt:   { floorA: '#3a3f5c', floorB: '#343954', line: '#292d46', spec: '#474d70', wallTop: '#1b1d33', wallFace: '#3d4366', wallHi: '#5a628c', wallDark: '#2a2e4a', glow: '#8aa0ff', fog: '#0b0b14' },
    swamp:   { floorA: '#2f4a3a', floorB: '#2a4234', line: '#203528', spec: '#3d6049', wallTop: '#14211b', wallFace: '#35523f', wallHi: '#4f7a5a', wallDark: '#243a2d', glow: '#8aff9a', fog: '#07110c' },
    inferno: { floorA: '#4a2f3a', floorB: '#40293a', line: '#2d1826', spec: '#5e3b4a', wallTop: '#1d0f17', wallFace: '#5a2a38', wallHi: '#8a3a46', wallDark: '#3a1a26', glow: '#ff8a4a', fog: '#12060a' },
    temple:  { floorA: '#5a5444', floorB: '#524d3e', line: '#3a3629', spec: '#6e6752', wallTop: '#1f1c15', wallFace: '#6b6450', wallHi: '#8e8668', wallDark: '#463f30', glow: '#ffd98a', fog: '#0e0c08' },
    hell:    { floorA: '#2a1a1c', floorB: '#241618', line: '#180e10', spec: '#3a2224', wallTop: '#0f0708', wallFace: '#3a2022', wallHi: '#6a2a22', wallDark: '#220f10', glow: '#ff4a2a', fog: '#0a0304' },
    maze:    { floorA: '#4d4a3c', floorB: '#454236', line: '#2f2d24', spec: '#5c584a', wallTop: '#1a1810', wallFace: '#5a5240', wallHi: '#7a7058', wallDark: '#3a3528', glow: '#ffc070', fog: '#0a0907' },
    sky:     { floorA: '#7a86a8', floorB: '#707c9e', line: '#56607f', spec: '#9aa6c8', wallTop: '#2a3150', wallFace: '#8a96b8', wallHi: '#c8d2ee', wallDark: '#5a6688', glow: '#fff2a0', fog: '#10142a' },
  };
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function mkTile(fn) { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); fn(g); return c; }
  function tiles(th) {
    const T = THEMES[th]; seed = 7;
    const floor = [0, 1, 2, 3].map(v => mkTile(g => {
      g.fillStyle = (v % 2) ? T.floorB : T.floorA; g.fillRect(0, 0, 16, 16);
      g.fillStyle = T.line; g.fillRect(0, 0, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(0, 8 + (v > 1 ? 0 : 0), 16, 1); g.fillRect(8, 0, 1, 8);
      g.fillStyle = T.spec; for (let i = 0; i < 6; i++) g.fillRect(Math.floor(rnd() * 15) + 1, Math.floor(rnd() * 15) + 1, 1, 1);
      g.fillStyle = T.line; if (v === 3) { g.fillRect(3, 4, 4, 1); g.fillRect(6, 5, 1, 3); g.fillRect(7, 8, 3, 1); }
      if (th === 'temple' && v === 1) { g.fillStyle = T.wallDark; g.fillRect(3, 3, 1, 5); g.fillRect(4, 7, 3, 1); g.fillRect(7, 8, 1, 4); }
      if (th === 'sky' && v === 2) { g.fillStyle = '#c8d2ee'; g.fillRect(9, 10, 5, 1); g.fillRect(10, 9, 3, 1); }
      if (th === 'maze' && v === 0) { g.fillStyle = '#6a7a4a'; g.fillRect(11, 3, 3, 1); g.fillRect(12, 2, 1, 1); }
      if ((th === 'inferno' || th === 'hell') && v === 2) { g.fillStyle = '#ff6a2a'; g.fillRect(10, 11, 3, 1); g.fillRect(12, 12, 1, 2); g.fillStyle = '#ffb060'; g.fillRect(11, 11, 1, 1); }
      if (th === 'swamp' && v === 1) { g.fillStyle = '#4a7a50'; g.fillRect(2, 11, 4, 2); g.fillRect(3, 10, 2, 1); }
    }));
    const brick = (g, base, hi, dk) => {
      g.fillStyle = base; g.fillRect(0, 0, 16, 16);
      g.fillStyle = dk; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(5, 0, 1, 7); g.fillRect(12, 8, 1, 7);
      g.fillStyle = hi; g.fillRect(0, 0, 16, 1); g.fillRect(0, 8, 16, 1);
    };
    const wallFace = mkTile(g => { brick(g, T.wallFace, T.wallHi, T.wallDark); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 13, 16, 3); });
    const wallTop = mkTile(g => { g.fillStyle = T.wallTop; g.fillRect(0, 0, 16, 16); g.fillStyle = T.wallDark; for (let i = 0; i < 5; i++) g.fillRect(Math.floor(rnd() * 14), Math.floor(rnd() * 14), 3, 1); });
    const wallSide = mkTile(g => { g.fillStyle = T.wallTop; g.fillRect(0, 0, 16, 16); g.fillStyle = T.wallDark; g.fillRect(0, 0, 16, 1); g.fillRect(0, 8, 16, 1); g.fillStyle = T.wallFace; g.fillRect(0, 0, 2, 16); });
    const wallBottom = mkTile(g => { g.fillStyle = T.wallTop; g.fillRect(0, 0, 16, 16); g.fillStyle = T.wallHi; g.fillRect(0, 0, 16, 2); g.fillStyle = T.wallDark; g.fillRect(0, 2, 16, 2); });
    return { floor, wallFace, wallTop, wallSide, wallBottom, T };
  }
  function door(open, th) {
    const T = THEMES[th], P = new Pix(16, 32);
    P.r(0, 0, 16, 32, T.wallTop); P.r(1, 2, 14, 30, open ? '#07060d' : '#3a2a1a');
    if (open) { P.r(3, 6, 10, 26, '#120e22'); P.r(6, 12, 4, 20, '#1d1a38'); for (let i = 0; i < 6; i++) P.p(5 + (i * 3) % 7, 8 + i * 4, T.glow); }
    else { for (let x = 3; x < 15; x += 4) P.r(x, 3, 2, 29, '#6a6a7e'); P.r(1, 10, 14, 2, '#8a8aa0'); P.r(1, 22, 14, 2, '#8a8aa0'); P.r(10, 15, 3, 3, K.gold); }
    return P.finish(0, 31, { shade: false, outline: T.wallTop });
  }

  // ---------- Font bitmap 3x5 ----------
  const FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
    0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
    '!': '010010010000010', '?': '110001010000010', '.': '000000000000010', ',': '000000000010100', ':': '000010000010000', '+': '000010111010000', '-': '000000111000000', '%': '101001010100101', '/': '001001010100100', "'": '010010000000000', ' ': '000000000000000', 'x': '000101010101000' };
  function text(ctx, str, x, y, col, scale, align, outline) {
    str = String(str).toUpperCase(); scale = scale || 1; const w = (str.length * 4 - 1) * scale;
    if (align === 'center') x -= w / 2; else if (align === 'right') x -= w;
    x = Math.round(x); y = Math.round(y);
    const pass = (ox, oy, c) => { ctx.fillStyle = c; for (let i = 0; i < str.length; i++) { const g = FONT[str[i]] || FONT['?']; for (let k = 0; k < 15; k++) if (g[k] === '1') ctx.fillRect(x + ox + (i * 4 + (k % 3)) * scale, y + oy + Math.floor(k / 3) * scale, scale, scale); } };
    if (outline !== false) { const o = scale; pass(-o, 0, '#000'); pass(o, 0, '#000'); pass(0, -o, '#000'); pass(0, o, '#000'); }
    pass(0, 0, col || '#fff');
  }

  // ---------- Ikon UI (dataURL) ----------
  const iconCache = {};
  function icon(name) {
    if (iconCache[name]) return iconCache[name];
    const P = new Pix(12, 12), g = P;
    const M = {
      sword() { P.line(2, 9, 9, 2, K.steelL); P.line(3, 9, 9, 3, K.steel); P.r(1, 7, 4, 1, K.gold); P.line(2, 8, 4, 10, K.brown); P.p(9, 1, K.steelL); },
      heart() { P.ell(4, 4, 2.8, 2.8, K.red); P.ell(8, 4, 2.8, 2.8, K.red); P.poly([[1, 5], [11, 5], [6, 11]], K.red); P.p(3, 3, '#ffb0b0'); },
      boot() { P.r(3, 1, 4, 7, K.brown); P.r(3, 7, 8, 3, K.brown); P.r(3, 9, 8, 1, K.brownD); P.r(3, 1, 4, 1, K.gold); },
      cloak() { P.poly([[6, 0], [11, 11], [1, 11]], K.purple); P.poly([[6, 2], [9, 10], [3, 10]], K.purpleL); P.r(5, 0, 2, 2, K.gold); },
      drop() { P.poly([[6, 0], [10, 7], [2, 7]], K.cyan); P.ell(6, 7, 4, 3.5, '#2a7aff'); P.p(4, 6, '#fff'); },
      fang() { P.poly([[1, 1], [6, 1], [3, 10]], K.bone); P.poly([[6, 1], [11, 1], [8, 10]], K.bone); P.r(1, 0, 10, 2, K.red); },
      star() { P.poly([[6, 0], [7.5, 4.5], [12, 5], [8.5, 8], [9.5, 12], [6, 9.5], [2.5, 12], [3.5, 8], [0, 5], [4.5, 4.5]], K.gold); },
      spiral() { for (let a = 0; a < 7; a += 0.2) { const r = 1 + a * 0.75; P.p(6 + Math.cos(a) * r * 0.9, 6 + Math.sin(a) * r * 0.9, K.cyan); P.p(6 + Math.cos(a) * r * 0.9 + 1, 6 + Math.sin(a) * r * 0.9, '#2a7aff'); } },
      bolt() { P.poly([[7, 0], [2, 7], [6, 7], [4, 12], [10, 4], [6, 4]], K.yellow); P.poly([[7, 1], [4, 6], [7, 6]], '#fff7b0'); },
      shield() { P.poly([[1, 1], [11, 1], [11, 6], [6, 12], [1, 6]], K.steel); P.poly([[3, 3], [9, 3], [9, 6], [6, 9], [3, 6]], K.blue); P.r(5, 4, 2, 3, K.steelL); },
      potion() { P.r(5, 0, 2, 3, K.brown); P.ell(6, 7.5, 4.5, 4, '#e03a5a'); P.r(3, 6, 6, 1, '#ff9aaa'); P.r(4, 2, 4, 1, K.steelL); },
      fist() { P.r(2, 3, 8, 7, K.skin); for (let i = 0; i < 4; i++) P.r(2 + i * 2, 2, 2, 2, '#e0a070'); P.r(1, 6, 2, 3, '#e0a070'); P.r(2, 10, 8, 1, K.gold); },
      eye() { P.ell(6, 6, 5.5, 3.5, '#fff'); P.ell(6, 6, 2.5, 2.5, K.purple); P.p(6, 6, K.dark); },
      roll() { for (let a = 0; a < 5.2; a += 0.15) { P.p(6 + Math.cos(a) * 4.2, 6 + Math.sin(a) * 4.2, '#fff'); P.p(6 + Math.cos(a) * 3.4, 6 + Math.sin(a) * 3.4, K.cyan); } P.poly([[9, 1], [12, 6], [7, 5]], '#fff'); },
      pause() { P.r(3, 2, 2, 8, '#fff'); P.r(8, 2, 2, 8, '#fff'); },
      coin() { P.ell(6, 6, 5, 5, K.gold); P.ell(6, 6, 3, 3, '#b8862a'); P.r(5, 4, 2, 4, K.gold); },
      skull() { P.ell(6, 5, 5, 4.5, K.bone); P.r(3, 8, 6, 3, K.bone); P.r(3, 4, 2, 2, K.dark); P.r(7, 4, 2, 2, K.dark); },
    };
    (M[name] || M.star)();
    const spr = P.finish(0, 0, { outline: '#14101f', shade: false });
    return (iconCache[name] = spr.c.toDataURL());
  }

  const glowCache = {};
  function glow(col, r) {
    const k = col + r; if (glowCache[k]) return glowCache[k];
    const c = document.createElement('canvas'); c.width = c.height = r * 2; const g = c.getContext('2d');
    const gr = g.createRadialGradient(r, r, 0, r, r, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return (glowCache[k] = c);
  }

  // ---------- Bangun semua sprite ----------
  function build() {
    S.hero = { idle: [hero(0, 0), hero(0, 1)], run: [hero(1, 0), hero(0, 1), hero(2, 0), hero(0, 1)] };
    S.slime = [slime(0), slime(1), slime(2)];
    S.skeleton = { f: [skeleton(0, 0), skeleton(1, 0)], wind: skeleton(0, 1) };
    S.archer = { f: [skeleton(0, 0, true), skeleton(1, 0, true)] };
    S.bat = [bat(0), bat(1)];
    S.ghoul = { f: [ghoul(0, 0), ghoul(1, 0)], wind: ghoul(0, 1) };
    S.mage = { f: [mage(0, 0), mage(1, 0)], cast: mage(0, 1) };
    S.knight = { f: [knight(0, 0), knight(1, 0)], wind: knight(0, 1) };
    S.imp = [imp(0), imp(1)];
    S.colossus = { idle: [colossus('idle', 0), colossus('idle', 1)], raise: colossus('raise', 0), slam: colossus('slam', 0), dizzy: colossus('dizzy', 1) };
    S.witch = { idle: [witch('idle', 0), witch('idle', 1)], cast: witch('cast', 0) };
    S.dragon = { idle: [dragon('idle', 0), dragon('idle', 1)], roar: dragon('roar', 0), fly: dragon('fly', 1) };
    S.medusa = { idle: [medusa('idle', 0), medusa('idle', 1)], cast: medusa('cast', 0), dizzy: medusa('dizzy', 1), slam: medusa('slam', 0), raise: medusa('raise', 0) }; S.statue = [statue(0), statue(1)];
    S.cerberus = { idle: [cerberus('idle', 0), cerberus('idle', 1)], roar: cerberus('roar', 0), bite: cerberus('bite', 0), dizzy: cerberus('dizzy', 1) };
    S.minotaur = { idle: [minotaur('idle', 0), minotaur('idle', 1)], raise: minotaur('raise', 0), slam: minotaur('slam', 0), dizzy: minotaur('dizzy', 1) }; S.zeus = { idle: [zeus('idle', 0), zeus('idle', 1)], raise: zeus('raise', 0), slam: zeus('slam', 0), dizzy: zeus('dizzy', 1) };
    S.coin = [coin(0), coin(1)]; S.heart = heart(); S.orb = orb(); S.potion = potionSpr();
    S.pillar = {}; S.tiles = {}; S.door = {};
    for (const th of Object.keys(THEMES)) { S.pillar[th] = pillar(th); S.tiles[th] = tiles(th); S.door[th] = { closed: door(false, th), open: door(true, th) }; }
  }

  // Gambar sprite dengan anchor, opsi flip & flash putih
  // Versi sprite berwarna tunggal (cache) untuk efek batu
  S.tint = function (spr, col) {
    spr._t = spr._t || {};
    if (!spr._t[col]) { const c = document.createElement('canvas'); c.width = spr.w; c.height = spr.h; const g = c.getContext('2d'); g.drawImage(spr.c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = col; g.fillRect(0, 0, spr.w, spr.h); spr._t[col] = { c, w: spr.w, h: spr.h, ax: spr.ax, ay: spr.ay, fl: () => c }; }
    return spr._t[col];
  };
  S.draw = function (ctx, spr, x, y, flip, flash, alpha) {
    const img = flash ? spr.fl() : spr.c, dy = Math.round(y - spr.ay);
    if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
    if (flip) { ctx.save(); ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(img, -spr.ax, dy); ctx.restore(); }
    else ctx.drawImage(img, Math.round(x - spr.ax), dy);
    if (alpha !== undefined && alpha < 1) ctx.globalAlpha = 1;
  };
  // Lingkaran piksel solid
  S.disc = function (ctx, x, y, r, col) {
    ctx.fillStyle = col; x = Math.round(x); y = Math.round(y);
    for (let j = -r; j <= r; j++) { const h = Math.floor(Math.sqrt(r * r - j * j + 0.25)); ctx.fillRect(x - h, y + j, h * 2 + 1, 1); }
  };
  // Garis piksel (untuk efek tebasan)
  S.pxLine = function (ctx, x0, y0, x1, y1, col) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); ctx.fillStyle = col;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
    for (;;) { ctx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  };
  S.THEMES = THEMES; S.text = text; S.icon = icon; S.glow = glow; S.build = build;
  PC.S = S;
})(window.PC);
