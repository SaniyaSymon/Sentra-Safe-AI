/* SentraSafe AI — Service Worker
   App-shell + runtime cache + Web Push notifications.
*/
const VERSION = 'v1.1.0';
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
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) {
    if (/^(\/api\/(shelters|hospitals|colleges|hazards|campus-contacts|stats|risk-heatmap|damage-assessments|health))/.test(url.pathname)) {
      event.respondWith(networkFirst(req, API_CACHE));
    }
    return;
  }
  if (req.destination === 'image' || url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(cacheFirst(req, IMG_CACHE));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req, APP_CACHE));
  }
});

// -------- Web Push --------
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: 'SentraSafe AI', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'SentraSafe AI';
  const opts = {
    body: data.body || 'Emergency update',
    icon: '/assets/sentrasafe-logo.jpeg',
    badge: '/assets/sentrasafe-logo.jpeg',
    tag: data.sos_id || 'sentrasafe',
    renotify: true,
    vibrate: [200, 100, 200, 100, 400],
    data: data,
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window' }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('/');
  }));
});
