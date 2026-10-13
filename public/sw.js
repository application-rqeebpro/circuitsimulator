// Service Worker for Yemeni Mechatronics Lab PWA (مختبر الميكاترونكس اليمني)
const CACHE_NAME = 'yemen-mechatronics-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

// Install Event: Precaches essential app shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA: Some assets failed to precache during install:', err);
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate Event: Cleanup stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event: Network-first for dynamic navigation, Cache-first for immutable assets, Bypass for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Never cache or intercept server API calls (/api/*) or non-GET requests
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return; // Standard network fetch
  }

  // 2. Navigation requests: Network-first with offline fallback to index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html').then((cached) => {
          return cached || fetch(event.request);
        });
      })
    );
    return;
  }

  // 3. Static assets: Stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type === 'basic' &&
          (url.pathname.match(/\.(js|css|svg|png|jpg|woff2?)$/) || url.hostname.includes('fonts.gstatic.com'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Network failure, return cached if available
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
