/**
 * TeamForge Progressive Web App Service Worker
 * Secure offline shell caching with strict security exclusion for private APIs and credentials.
 */

const STATIC_CACHE_NAME = 'teamforge-static-v1';
const RUNTIME_CACHE_NAME = 'teamforge-runtime-v1';
const OFFLINE_URL = '/offline.html';

// Static Shell Assets to Pre-cache
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// 1. Install Event: Pre-cache static shell & offline fallback
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching static app shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== RUNTIME_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intelligent caching strategies with strict security boundary
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // SECURITY GUARD 1: Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // SECURITY GUARD 2: NEVER cache private API endpoints or WebSocket handshakes
  // Authentication, passwords, direct messages, and database responses are never stored on disk.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/socket.io/') ||
    request.headers.has('authorization') ||
    url.hostname.includes('mongodb')
  ) {
    // Pass through directly to network
    return;
  }

  // Strategy A: HTML Navigation (Network-First with Offline Fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, return it
          if (response && response.status === 200) {
            return response;
          }
          return caches.match(OFFLINE_URL);
        })
        .catch(() => {
          // If network is down, serve cached offline fallback page
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Strategy B: Static Assets & Fonts (Stale-While-Revalidate)
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
     url.pathname.startsWith('/icons/') ||
     url.pathname.endsWith('.js') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.woff2') ||
     url.pathname.endsWith('.png'));

  const isGoogleFont =
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';

  if (isStaticAsset || isGoogleFont) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(RUNTIME_CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch((err) => {
            // Network fetch failed; if nothing in cache, return error
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});
