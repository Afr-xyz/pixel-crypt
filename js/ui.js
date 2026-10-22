// UI berbasis DOM: HUD, menu, forge, perk, jeda, game over, kemenangan.
window.PC = window.PC || {};
(function (PC) {
  const G = PC.G, C = PC.C, S = PC.S, Save = PC.Save, Audio = PC.Audio;
  const $ = id => document.getElementById(id);
  const last = {};
  const set = (key, el, prop, val) => { if (last[key] !== val) { last[key] = val; if (prop === 'text') el.textContent = val; else if (prop === 'w') el.style.width = val; else el.style[prop] = val; } };
  const show = id => { $(id).classList.remove('hidden'); };
  const hide = id => { $(id).classList.add('hidden'); };
  const screens = ['scr-menu', 'scr-forge', 'scr-help', 'scr-pause', 'scr-perk', 'scr-over'];
  const only = id => { for (const s of screens) hide(s); if (id) show(id); };
  const fmtTime = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const click = () => Audio.play('click');

  const UI = PC.UI = {
    init() {
      document.querySelectorAll('[data-ico]').forEach(el => { const u = 'url(' + S.icon(el.dataset.ico) + ')'; el.style.backgroundImage = u; });
      $('m-play').onclick = () => { Audio.init(); click(); UI.goFull(); if (!Save.data.tutorial) { Save.data.tutorial = true; Save.save(); UI.showHelp(true); } else UI.start(); };
      $('m-forge').onclick = () => { Audio.init(); click(); UI.showForge(); };
      $('m-help').onclick = () => { Audio.init(); click(); UI.showHelp(false); };
      $('m-sound').onclick = $('p-sound').onclick = () => { Audio.init(); Audio.setEnabled(!Audio.isEnabled()); Save.data.sound = Audio.isEnabled(); Save.save(); UI.syncSound(); click(); };
      $('m-full').onclick = () => { click(); UI.toggleFull(); };
      $('forge-back').onclick = () => { click(); UI.showMenu(); };
      $('help-back').onclick = () => { click(); if (UI.helpThenStart) { UI.helpThenStart = false; UI.start(); } else UI.showMenu(); };
      $('btn-pause').addEventListener('pointerdown', e => { e.preventDefault(); PC.Game.pause(); });
      $('p-resume').onclick = () => { click(); PC.Game.resume(); };
      $('p-restart').onclick = () => { click(); PC.Game.bank(true); UI.start(); };
      $('p-quit').onclick = () => { click(); PC.Game.quitRun(); };
      G.banner = UI.banner; G.toast = UI.toast;
      UI.syncSound(); UI.showMenu();
    },
    syncSound() { const t = 'SUARA: ' + (Audio.isEnabled() ? 'ON' : 'OFF'); $('m-sound').textContent = t; $('p-sound').textContent = t; },
    goFull() {
      try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) { const r = el.requestFullscreen({ navigationUI: 'hide' }); const lock = () => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) {} }; if (r && r.then) r.then(lock).catch(() => {}); else lock(); } else if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
      try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); } catch (e) {}
    },
    toggleFull() { try { if (document.fullscreenElement) document.exitFullscreen(); else UI.goFull(); } catch (e) {} },
    playUI(on) { $('hud').classList.toggle('hidden', !on); $('controls').classList.toggle('hidden', !on); },
    start() { only(null); UI.playUI(true); PC.Audio.init(); PC.Game.startRun(); },
    showMenu() {
      UI.playUI(false); only('scr-menu'); const s = Save.data, b = s.best;
      $('m-stats').textContent = 'EMAS ' + s.gold + '  |  REKOR: LANTAI ' + (b.floor + 1) + '-' + (b.room + 1) + '  |  BOSS ' + Object.values(s.bossKills).reduce((a, c) => a + c, 0) + '  |  MENANG ' + s.wins;
      Audio.music('menu');
    },
    showHelp(thenStart) { UI.helpThenStart = !!thenStart; only('scr-help'); },
    showForge() {
      only('scr-forge'); $('forge-gold').textContent = Save.data.gold; const list = $('forge-list'); list.innerHTML = '';
      for (const f of C.FORGE) {
        const lv = Save.data.forge[f.id], maxed = lv >= f.max, cost = f.cost[lv];
        const row = document.createElement('div'); row.className = 'forge-row';
        row.innerHTML = `<i class="ico-md" style="background-image:url(${S.icon(f.icon)})"></i><div class="flex-1"><div class="text-[3vh] font-black">${f.name}</div><div class="text-[2.1vh] text-[#c8c8e8]">${f.desc}</div><div class="mt-[.6vh]">${Array.from({ length: f.max }, (_, i) => `<span class="pip ${i < lv ? 'on' : ''}"></span>`).join('')}</div></div>`;
        const btn = document.createElement('button'); btn.className = 'px-btn primary w-[18vh] h-[7vh] text-[2.6vh]'; btn.textContent = maxed ? 'MAKS' : 'BELI ' + cost; btn.disabled = maxed || Save.data.gold < cost;
        btn.onclick = () => { if (maxed || Save.data.gold < cost) return; Save.data.gold -= cost; Save.data.forge[f.id]++; Save.save(); Audio.play('perk'); UI.showForge(); };
        row.appendChild(btn); list.appendChild(row);
      }
    },
    showPause() { UI.syncSound(); $('scr-pause').classList.remove('hidden'); },
    hidePause() { hide('scr-pause'); },
    showPerks(picks) {
      only('scr-perk'); const box = $('perk-list'); box.innerHTML = '';
      for (const pk of picks) {
        const b = document.createElement('button'); b.className = 'px-panel perk-card'; b.style.pointerEvents = 'auto';
        b.innerHTML = `<img class="pic" src="${S.icon(pk.icon)}" alt=""><div class="text-[2.8vh] font-black text-[#ffe066]">${pk.name}</div><div class="text-[2.2vh] leading-tight text-[#e0e0ff]">${pk.desc}</div>`;
        b.onclick = () => { only(null); PC.Game.choosePerk(pk); };
        box.appendChild(b);
      }
    },
    endBox(win) {
      const r = G.run, s = Save.data, F = C.FLOORS[Math.min(r.floor, C.FLOORS.length - 1)];
      $('over-box').innerHTML = `<h2 class="text-[7vh] font-black ${win ? 'text-[#ffd060]' : 'text-[#ff5a6a]'} mb-[1vh]">${win ? 'KEMENANGAN!' : 'KAMU GUGUR'}</h2>
        <p class="text-[2.6vh] text-[#c8b8ff] mb-[2vh]">${win ? 'Takhta Langit direbut. Zeus telah tumbang.' : 'Lantai ' + (r.floor + 1) + ' - ' + F.name}</p>
        <div class="grid grid-cols-2 gap-x-[4vh] gap-y-[.6vh] text-[2.6vh] text-left mb-[2.2vh]"><span>Lantai dituntaskan</span><b class="text-right">${win ? C.FLOORS.length : r.floor}/${C.FLOORS.length}</b><span>Musuh dikalahkan</span><b class="text-right">${r.kills}</b><span>Perfect dodge</span><b class="text-right">${r.perfects}</b><span>Emas didapat</span><b class="text-right text-[#ffd060]">+${r.gold}</b><span>Waktu</span><b class="text-right">${fmtTime(r.time)}</b><span>Total emas</span><b class="text-right">${s.gold}</b></div>
        <div class="flex flex-col items-center gap-[1.2vh]"><button id="o-retry" class="px-btn primary w-[40vh] h-[8vh] text-[3.2vh]">${win ? 'MAIN LAGI' : 'COBA LAGI'}</button><div class="flex gap-[1.2vh]"><button id="o-forge" class="px-btn w-[19.4vh] h-[7vh] text-[2.6vh]">FORGE</button><button id="o-menu" class="px-btn w-[19.4vh] h-[7vh] text-[2.6vh]">MENU</button></div></div>`;
      $('o-retry').onclick = () => { click(); UI.start(); }; $('o-forge').onclick = () => { click(); PC.Game.menuScene(); UI.showForge(); }; $('o-menu').onclick = () => { click(); PC.Game.menuScene(); UI.showMenu(); };
      only('scr-over'); UI.playUI(false);
    },
    showOver() { UI.endBox(false); }, showWin() { UI.endBox(true); },

    banner(t, s) { const el = $('banner'); $('banner-t').textContent = t; $('banner-s').textContent = s || ''; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); },
    toast(m) { const el = $('toast'); el.textContent = m; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); },

    updateHud() {
      const p = G.player; if (!p) return;
      set('hp', $('hp-fill'), 'w', (p.hp / p.maxHp * 100).toFixed(1) + '%'); set('hpg', $('hp-ghost'), 'w', (p.hp / p.maxHp * 100).toFixed(1) + '%');
      set('hpt', $('hp-text'), 'text', Math.ceil(p.hp) + '/' + p.maxHp);
      set('mp', $('mp-fill'), 'w', (p.mp / p.maxMp * 100).toFixed(1) + '%'); set('mpt', $('mp-text'), 'text', Math.floor(p.mp) + '/' + p.maxMp);
      set('st', $('st-fill'), 'w', (p.st / p.maxSt * 100).toFixed(1) + '%');
      set('gold', $('gold-text'), 'text', String(G.run.gold)); const rm = G.rm;
      if (rm) set('room', $('room-label'), 'text', 'L' + (rm.floor + 1) + '-' + (rm.boss ? 'BOSS' : (rm.idx + 1) + '/' + C.ROOMS_PER_FLOOR));
      for (let i = 0; i < 3; i++) {
        const btn = $('btn-s' + i), sk = PC.Player.SK[i], max = sk.cd * p.cdMul[i];
        set('cd' + i, btn.querySelector('.cd'), 'height', (p.cd[i] > 0 ? Math.min(100, p.cd[i] / max * 100) : 0).toFixed(0) + '%');
        const lack = p.mp < sk.mp; if (last['lk' + i] !== lack) { last['lk' + i] = lack; btn.classList.toggle('lack', lack); }
      }
      set('potn', $('potion-n'), 'text', String(p.potions)); const em = p.potions <= 0; if (last.pem !== em) { last.pem = em; $('btn-potion').classList.toggle('empty', em); }
      set('pcd', $('btn-potion').querySelector('.cd'), 'height', (p.potionCd > 0 ? p.potionCd / 2.5 * 100 : 0).toFixed(0) + '%');
      const b = G.boss, bb = $('boss-bar'); const showB = !!(b && !b.dead);
      if (last.bshow !== showB) { last.bshow = showB; bb.classList.toggle('hidden', !showB); }
      if (showB) { set('bn', $('boss-name'), 'text', b.name + (b.phase ? ' ' + 'I'.repeat(b.phase + 1) : '')); const w = (Math.max(0, b.hp) / b.maxHp * 100).toFixed(1) + '%'; set('bf', $('boss-fill'), 'w', w); set('bg', $('boss-ghost'), 'w', w); }
    },
  };
})(window.PC);
