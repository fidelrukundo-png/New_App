/* ============================================================
   Fidel's Finances — Service Worker
   Provides full offline support via Cache-first strategy
   ============================================================ */

const CACHE_NAME = 'fidels-finances-v1';

// Files to cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ── Install: pre-cache all assets ───────────────────────────
self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Pre-caching assets');
        return cache.addAll(PRECACHE_ASSETS).catch(function(err) {
          console.warn('[SW] Pre-cache failed (non-fatal):', err);
        });
      })
      .then(function() {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
  );
});

// ── Activate: clean up old caches ───────────────────────────
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames
            .filter(function(name) { return name !== CACHE_NAME; })
            .map(function(name) {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(function() {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// ── Fetch: cache-first, fallback to network ─────────────────
self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(function(cachedResponse) {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then(function(networkResponse) {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              var responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then(function(cache) {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(function() {
            // Offline fallback
            return caches.match('./index.html');
          });
      })
  );
});
