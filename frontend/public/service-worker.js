/* SentraSafe AI — Service Worker
   App-shell + runtime cache for offline PWA operation.
   Strategy:
   - App shell (HTML/JS/CSS): stale-while-revalidate
   - GET API JSON (/api/*): network-first, fallback to cache
   - Static images/logo: cache-first
   - Fonts + tile images: cache-first with short TTL
   - Never cache non-GET
*/
const VERSION = 'v1.0.4';
const APP_CACHE = `ss-app-${VERSION}`;
const API_CACHE = `ss-api-${VERSION}`;
const IMG_CACHE = `ss-img-${VERSION}`;
const APP_SHELL = ['/', '/manifest.json', '/assets/sentrasafe-logo.jpeg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_SHELL).catch(() => {})));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => ![APP_CACHE, API_CACHE, IMG_CACHE].includes(k)).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', cached: false }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return cached || new Response('', { status: 504 });
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // don't cache mutations
  const url = new URL(req.url);
  // Reference read APIs → network-first
  if (url.pathname.startsWith('/api/')) {
    // Only cache safe read-heavy endpoints
    if (/^(\/api\/(shelters|hospitals|colleges|hazards|campus-contacts|stats|risk-heatmap|damage-assessments|health))/.test(url.pathname)) {
      event.respondWith(networkFirst(req, API_CACHE));
    }
    return;
  }
  // Images / tiles
  if (req.destination === 'image' || url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(cacheFirst(req, IMG_CACHE));
    return;
  }
  // App shell
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req, APP_CACHE));
  }
});
