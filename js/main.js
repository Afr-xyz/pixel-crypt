// Boot: simpan data, input, UI, game, service worker, pause otomatis.
(function (PC) {
  function showErr(msg) { const el = document.getElementById('err'); if (el) { el.textContent = String(msg).slice(0, 600); el.classList.remove('hidden'); } }
  window.addEventListener('error', e => showErr(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  window.addEventListener('unhandledrejection', e => showErr(e.reason));
  function boot() {
    PC.Save.load(); PC.Audio.setEnabled(PC.Save.data.sound !== false);
    PC.In.init(); PC.Game.init(document.getElementById('game')); PC.UI.init();
    PC.G.onError = showErr; PC.In.pauseHandler = () => { if (PC.G.state === 'play' || PC.G.state === 'paused') PC.Game.pause(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden && PC.G.state === 'play') PC.Game.pause(); });
    const mq = window.matchMedia('(orientation: portrait)'); const onO = () => { if (mq.matches && PC.G.state === 'play') PC.Game.pause(); };
    if (mq.addEventListener) mq.addEventListener('change', onO);
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/[?&]nosw/.test(location.search)) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.PC);
