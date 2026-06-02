const CACHE_NAME = 'musicflow-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Cache static assets
  if (
    event.request.url.includes('/_next/') ||
    event.request.url.includes('.svg') ||
    event.request.url.includes('.png') ||
    event.request.url.includes('.css')
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
        return cached || fetchPromise;
      })
    );
  }
});
