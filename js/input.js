// Input: joystick melayang (kiri), tombol aksi (kanan), keyboard (untuk uji di PC).
window.PC = window.PC || {};
(function (PC) {
  const BUF = 0.18;
  const In = {
    mx: 0, my: 0,                    // vektor gerak analog (-1..1)
    held: { attack: false, dodge: false, s0: false, s1: false, s2: false, potion: false },
    buf: { attack: 0, dodge: 0, s0: 0, s1: 0, s2: 0, potion: 0, pause: 0 },
    keys: {},
    press(name) { In.held[name] = true; In.buf[name] = BUF; },
    release(name) { In.held[name] = false; },
    consume(name) { if (In.buf[name] > 0) { In.buf[name] = 0; return true; } return false; },
    update(dt) { for (const k in In.buf) if (In.buf[k] > 0) In.buf[k] -= dt; },
    clear() { In.mx = In.my = 0; for (const k in In.held) In.held[k] = false; for (const k in In.buf) In.buf[k] = 0; In.keys = {}; },
    vibrate(ms) { try { if (navigator.vibrate && PC.Save.data.vibrate !== false) navigator.vibrate(ms); } catch (e) {} },
    pauseHandler: null,
  };

  // ---- Joystick ----
  function setupJoystick() {
    const zone = document.getElementById('stick-zone'), base = document.getElementById('stick-base'), knob = document.getElementById('stick-knob');
    if (!zone) return;
    let id = null, cx = 0, cy = 0; const R = 44;
    const place = (x, y) => { const r = zone.getBoundingClientRect(); base.style.left = (x - r.left) + 'px'; base.style.top = (y - r.top) + 'px'; };
    zone.addEventListener('pointerdown', e => {
      if (id !== null) return; id = e.pointerId; zone.setPointerCapture(id); cx = e.clientX; cy = e.clientY; place(cx, cy);
      base.style.opacity = 1; knob.style.transform = 'translate(-50%,-50%)'; e.preventDefault();
    });
    zone.addEventListener('pointermove', e => {
      if (e.pointerId !== id) return; let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
      if (d > R) { cx += dx * (d - R) / d; cy += dy * (d - R) / d; dx = e.clientX - cx; dy = e.clientY - cy; place(cx, cy); } // basis mengikuti jempol
      const m = Math.min(1, Math.hypot(dx, dy) / R); const a = Math.atan2(dy, dx);
      In.mx = Math.cos(a) * m; In.my = Math.sin(a) * m; if (m < 0.18) { In.mx = In.my = 0; }
      knob.style.transform = `translate(calc(-50% + ${Math.cos(a) * m * R}px), calc(-50% + ${Math.sin(a) * m * R}px))`;
    });
    const end = e => { if (e.pointerId !== id) return; id = null; In.mx = In.my = 0; base.style.opacity = 0.35; knob.style.transform = 'translate(-50%,-50%)'; place(zone.clientWidth * 0.22, zone.clientHeight * 0.68); };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
    place(zone.clientWidth * 0.22, zone.clientHeight * 0.68); base.style.opacity = 0.35;
    In.resetStick = () => { id = null; In.mx = In.my = 0; base.style.opacity = 0.35; knob.style.transform = 'translate(-50%,-50%)'; place(zone.clientWidth * 0.22, zone.clientHeight * 0.68); };
  }

  // ---- Tombol ----
  const BTN = { 'btn-attack': 'attack', 'btn-dodge': 'dodge', 'btn-s0': 's0', 'btn-s1': 's1', 'btn-s2': 's2', 'btn-potion': 'potion' };
  function setupButtons() {
    for (const id in BTN) {
      const el = document.getElementById(id); if (!el) continue; const name = BTN[id]; let pid = null;
      el.addEventListener('pointerdown', e => { pid = e.pointerId; try { el.setPointerCapture(pid); } catch (x) {} In.press(name); el.classList.add('pressed'); e.preventDefault(); });
      const up = e => { if (e.pointerId !== pid) return; pid = null; In.release(name); el.classList.remove('pressed'); };
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    }
  }

  // ---- Keyboard ----
  const KMAP = { KeyJ: 'attack', KeyK: 'dodge', Space: 'dodge', KeyU: 's0', KeyI: 's1', KeyO: 's2', KeyH: 'potion' };
  function setupKeys() {
    addEventListener('keydown', e => {
      if (e.code === 'Escape' || e.code === 'KeyP') { if (In.pauseHandler) In.pauseHandler(); return; }
      In.keys[e.code] = true; if (KMAP[e.code] && !e.repeat) In.press(KMAP[e.code]); if (KMAP[e.code]) e.preventDefault();
      if (e.code.startsWith('Arrow')) e.preventDefault(); keyAxis();
    });
    addEventListener('keyup', e => { In.keys[e.code] = false; if (KMAP[e.code]) In.release(KMAP[e.code]); keyAxis(); });
    addEventListener('blur', () => In.clear());
  }
  function keyAxis() {
    const k = In.keys; if (Math.hypot(In.mx, In.my) > 0 && !In._kb) return;
    let x = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0), y = (k.KeyS || k.ArrowDown ? 1 : 0) - (k.KeyW || k.ArrowUp ? 1 : 0);
    const l = Math.hypot(x, y) || 1; In.mx = x / l; In.my = y / l; In._kb = !!(x || y);
  }

  In.init = function () {
    setupJoystick(); setupButtons(); setupKeys();
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  };
  PC.In = In;
})(window.PC);
