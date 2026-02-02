// IoT Remote System Vitals - Service Worker
// Caches all static assets for offline support

const CACHE_NAME = 'iot-vitals-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        // Cache static assets first
        return cache.addAll(STATIC_ASSETS)
          .then(() => {
            // Then cache external resources (non-blocking)
            return Promise.allSettled(
              EXTERNAL_RESOURCES.map(url => 
                cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
              )
            );
          });
      })
      .then(() => {
        console.log('[Service Worker] All assets cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API requests - always fetch from network
  if (url.pathname.startsWith('/api/')) {
    console.log('[Service Worker] API request, bypassing cache:', url.pathname);
    event.respondWith(fetch(request));
    return;
  }

  // Skip WebSocket requests
  if (url.pathname.startsWith('/ws')) {
    console.log('[Service Worker] WebSocket request, bypassing cache');
    event.respondWith(fetch(request));
    return;
  }

  // For static assets: Cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', url.pathname);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        console.log('[Service Worker] Fetching from network:', url.pathname);
        return fetch(request)
          .then((networkResponse) => {
            // Cache successful responses for static assets
            if (networkResponse.ok && request.method === 'GET') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                  console.log('[Service Worker] Cached new resource:', url.pathname);
                });
            }
            return networkResponse;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            // Return offline page if you have one
            // return caches.match('/offline.html');
            throw error;
          });
      })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing cache');
    event.waitUntil(
      caches.delete(CACHE_NAME)
        .then(() => console.log('[Service Worker] Cache cleared'))
    );
  }
});
