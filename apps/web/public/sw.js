/**
 * CloudVault PWA Service Worker
 *
 * CRITICAL ZERO-KNOWLEDGE SECURITY INVARIANT:
 * - NEVER cache API responses (/api/*)
 * - NEVER cache presigned S3 URLs or upload/download payloads
 * - NEVER cache credentials, auth tokens, or encryption keys
 * - Only cache static, immutable application shell assets (.html, .js, .css, .svg, fonts)
 */

const CACHE_NAME = 'cloudvault-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. STRICT EXCLUSION: Never intercept or cache API requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. STRICT EXCLUSION: Never intercept or cache S3 / MinIO storage requests
  if (url.port === '9000' || url.hostname.includes('amazonaws.com') || url.pathname.includes('/cloudvault-storage/')) {
    return;
  }

  // 3. STRICT EXCLUSION: Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // 4. Stale-while-revalidate for static application shell
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cache
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          })
          .catch(() => {
            // Network failure: cached asset is already returned
          });
        return cachedResponse;
      }

      return fetch(event.request).catch(() => {
        // Fallback for navigation to index.html if offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

