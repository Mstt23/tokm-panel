const CACHE_NAME = 'tokm-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          const urlObj = new URL(event.request.url);

          if (
            !urlObj.pathname.endsWith('.html') &&
            !urlObj.pathname.endsWith('/') &&
            (urlObj.pathname.includes('/assets/') ||
             urlObj.pathname.match(/\.(jpg|jpeg|png|gif|svg|woff|woff2|ttf)$/))
          ) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
