// Utilitas umum: matematika, generator timing, simpanan lokal.
window.PC = window.PC || {};
(function (PC) {
  const TAU = Math.PI * 2;
  const U = {
    TAU,
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp: (a, b, t) => a + (b - a) * t,
    rand: (a, b) => a + Math.random() * (b - a),
    randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    choice: a => a[Math.floor(Math.random() * a.length)],
    shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    dist: (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
    angle: (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax),
    angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; },
    hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; },
    rgb2hex: (r, g, b) => '#' + [r, g, b].map(v => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''),
    // amt>0 terang, amt<0 gelap
    shade(hex, amt) { const [r, g, b] = U.hex2rgb(hex); const t = amt < 0 ? 0 : 255, k = Math.abs(amt); return U.rgb2hex(r + (t - r) * k, g + (t - g) * k, b + (t - b) * k); },

    // ---- Generator helpers (dipakai AI musuh & boss). `yield` menerima dt dari frame ----
    *during(dur, fn) { let t = 0; while (t < dur) { const dt = yield; t += dt; if (fn && fn(dt, Math.min(1, t / dur), t) === false) return false; } return true; },
    *wait(s) { let t = 0; while (t < s) { t += yield; } },
    *until(cond, maxT) { let t = 0; while (!cond() && t < (maxT || 99)) { t += yield; } },
  };

  // ---- Penyimpanan ----
  const KEY = 'pixelcrypt.save.v1';
  const defaults = () => ({ gold: 0, best: { floor: 0, room: 0 }, kills: 0, runs: 0, wins: 0, bossKills: {}, forge: { vit: 0, pow: 0, foc: 0, alch: 0, agi: 0 }, tutorial: false, sound: true });
  const Save = {
    data: defaults(),
    load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) { const d = defaults(); Save.data = Object.assign(d, s, { forge: Object.assign(d.forge, s.forge || {}), best: Object.assign(d.best, s.best || {}) }); } } catch (e) {} },
    save() { try { localStorage.setItem(KEY, JSON.stringify(Save.data)); } catch (e) {} },
    reset() { Save.data = defaults(); Save.save(); }
  };
  PC.U = U; PC.Save = Save;
})(window.PC);
