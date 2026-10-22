// Service worker: cache aset agar game bisa dimainkan offline (butuh HTTPS atau localhost).
const CACHE = 'pixel-crypt-v3';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './css/tailwind.css', './css/style.css',
  './js/util.js', './js/config.js', './js/sprites.js', './js/audio.js', './js/input.js', './js/world.js',
  './js/entities.js', './js/enemies.js', './js/bosses.js', './js/game.js', './js/ui.js', './js/main.js',
  './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
// stale-while-revalidate
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request);
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
