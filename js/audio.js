// Audio sintetis WebAudio: efek suara + musik chiptune sederhana. Tanpa file audio.
window.PC = window.PC || {};
(function (PC) {
  let ctx = null, master = null, sfxGain = null, musGain = null, enabled = true;
  let track = null, step = 0, nextT = 0, timer = null;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = enabled ? 0.7 : 0; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.8; sfxGain.connect(master);
    musGain = ctx.createGain(); musGain.gain.value = 0.22; musGain.connect(master);
  }
  function tone(type, f0, f1, dur, vol, dest, delay) {
    if (!ctx) return; const t = ctx.currentTime + (delay || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || sfxGain); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, fc, delay) {
    if (!ctx) return; const t = ctx.currentTime + (delay || 0), n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = fc || 2000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t);
  }
  const SFX = {
    swing: () => { noise(0.1, 0.25, 3000); tone('triangle', 420, 180, 0.1, 0.12); },
    hit: () => { noise(0.08, 0.35, 1800); tone('square', 220, 80, 0.09, 0.2); },
    crit: () => { noise(0.12, 0.4, 3500); tone('square', 520, 120, 0.14, 0.25); tone('triangle', 880, 440, 0.12, 0.15); },
    hurt: () => { tone('sawtooth', 200, 60, 0.28, 0.3); noise(0.2, 0.3, 900); },
    dodge: () => { noise(0.16, 0.18, 1200); tone('sine', 300, 700, 0.14, 0.1); },
    perfect: () => { tone('sine', 880, 1760, 0.25, 0.22); tone('triangle', 1320, 1980, 0.3, 0.15, null, 0.05); },
    whirl: () => { noise(0.45, 0.25, 2500); tone('sawtooth', 200, 500, 0.4, 0.12); },
    lance: () => { tone('square', 900, 300, 0.22, 0.18); tone('sine', 1400, 500, 0.2, 0.12); },
    aegis: () => { tone('sine', 300, 900, 0.3, 0.2); tone('triangle', 600, 1200, 0.3, 0.12, null, 0.08); },
    shieldBreak: () => { noise(0.25, 0.35, 4000); tone('square', 700, 90, 0.3, 0.22); },
    potion: () => { tone('sine', 500, 1000, 0.1, 0.2); tone('sine', 700, 1400, 0.14, 0.2, null, 0.1); },
    coin: () => { tone('square', 1200, 1200, 0.05, 0.1); tone('square', 1600, 1600, 0.08, 0.1, null, 0.05); },
    pickup: () => { tone('triangle', 600, 1200, 0.12, 0.15); },
    kill: () => { noise(0.14, 0.3, 1500); tone('square', 300, 60, 0.18, 0.18); },
    telegraph: () => { tone('sine', 150, 150, 0.12, 0.08); },
    slam: () => { noise(0.4, 0.5, 600); tone('sine', 120, 35, 0.4, 0.5); },
    roar: () => { noise(0.8, 0.35, 700); tone('sawtooth', 110, 55, 0.8, 0.3); tone('square', 70, 40, 0.8, 0.2); },
    fire: () => { noise(0.18, 0.25, 2200); tone('sawtooth', 500, 200, 0.16, 0.1); },
    explode: () => { noise(0.5, 0.5, 900); tone('sine', 140, 40, 0.5, 0.4); },
    door: () => { tone('square', 200, 400, 0.25, 0.15); noise(0.3, 0.2, 800); },
    perk: () => { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, f, 0.18, 0.2, null, i * 0.07)); },
    win: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone('square', f, f, 0.3, 0.15, null, i * 0.12)); },
    lose: () => { [392, 330, 262, 196].forEach((f, i) => tone('sawtooth', f, f * 0.9, 0.4, 0.2, null, i * 0.2)); },
    click: () => { tone('square', 700, 500, 0.05, 0.12); },
    spawn: () => { tone('sine', 200, 800, 0.4, 0.1); },
  };

  // Musik: pola arpeggio minor
  const TRACKS = {
    explore: { bpm: 108, bass: [0, 0, 7, 7, 3, 3, 5, 5], root: 55, scale: [0, 3, 7, 10, 12, 10, 7, 3], wave: 'triangle' },
    boss: { bpm: 152, bass: [0, 0, 1, 0, 0, 0, 6, 5], root: 49, scale: [0, 3, 6, 7, 12, 7, 6, 3], wave: 'square' },
    menu: { bpm: 84, bass: [0, 0, 5, 5, 3, 3, 7, 7], root: 55, scale: [0, 7, 12, 7, 3, 10, 15, 10], wave: 'triangle' },
  };
  const hz = (root, semi) => root * Math.pow(2, semi / 12);
  function sched() {
    if (!ctx || !track) return;
    const T = TRACKS[track], dur = 60 / T.bpm / 2;
    while (nextT < ctx.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % T.bass.length, i = step % 8, rootSemi = T.bass[bar];
      const t0 = nextT - ctx.currentTime;
      if (i % 2 === 0) tone(T.wave, hz(T.root, rootSemi), hz(T.root, rootSemi), dur * 1.8, 0.35, musGain, t0);
      tone('square', hz(T.root * 4, rootSemi + T.scale[i]), hz(T.root * 4, rootSemi + T.scale[i]), dur * 0.8, 0.08, musGain, t0);
      if (track === 'boss' && i % 4 === 2) noise(0.05, 0.1, 5000, t0);
      step++; nextT += dur;
    }
  }
  PC.Audio = {
    init,
    play(n) { if (enabled && ctx && SFX[n]) { try { SFX[n](); } catch (e) {} } },
    music(name) {
      if (track === name) return; track = name; step = 0; if (!ctx) return; nextT = ctx.currentTime + 0.05;
      if (!timer) timer = setInterval(sched, 100);
      if (!name) { clearInterval(timer); timer = null; }
    },
    setEnabled(v) { enabled = v; if (master) master.gain.value = v ? 0.7 : 0; },
    isEnabled: () => enabled,
    resumeMusic() { if (ctx && track) { nextT = ctx.currentTime + 0.05; if (!timer) timer = setInterval(sched, 100); } },
    pauseMusic() { if (timer) { clearInterval(timer); timer = null; } },
  };
})(window.PC);
