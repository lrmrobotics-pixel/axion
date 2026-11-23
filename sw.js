/* Lord of Engineer · service worker: funciona sin conexión */
const CACHE = 'axion-v6';
const ASSETS = ['./', 'index.html', 'styles.css', 'js/vendor/capacitor.js', 'js/core.js', 'js/games-math.js', 'js/games-lab.js', 'js/learn.js', 'js/mathview.js', 'js/lessons.js', 'js/kingdom.js', 'js/app.js', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {}); return r; })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('index.html')))
  );
});
