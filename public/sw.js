// ct-v2: network-first for HTML so deploys actually reach installed PWAs.
// The old cache-first-everything SW pinned users to a stale HTML that
// referenced dead chunk hashes → mixed old/new CSS after every deploy.
const CACHE = 'ct-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  const url = new URL(request.url);

  // Hashed build assets are immutable — cache-first is safe and fast.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    e.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      }))
    );
    return;
  }

  // Everything else — network-first; cache only navigations/manifest as an
  // offline fallback. Never serve stale HTML when the network is available.
  e.respondWith(
    fetch(request).then(res => {
      if (res.ok && (request.mode === 'navigate' || url.pathname === '/manifest.json')) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(request, clone));
      }
      return res;
    }).catch(() => caches.match(request))
  );
});
