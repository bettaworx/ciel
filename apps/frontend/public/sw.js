// Service Worker for Ciel PWA
// Implements hybrid caching strategy for optimal offline experience

const CACHE_VERSION = 'v4';
const STATIC_CACHE = `ciel-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ciel-dynamic-${CACHE_VERSION}`;
const RSC_CACHE = `ciel-rsc-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/pwa/manifest.json',
];

// Install event: Precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      // Activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old versions of our caches
            return (
              cacheName.startsWith('ciel-static-') ||
              cacheName.startsWith('ciel-dynamic-') ||
              cacheName.startsWith('ciel-rsc-')
            ) && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== RSC_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event: Route requests based on type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip Range requests (video/audio seeking) - never cache partial content
  if (request.headers.get('range')) {
    return;
  }

  // Media files - Network Only (large files should not be buffered or cached)
  if (url.pathname.match(/\.(mp4|webm|ogg|mp3|wav|flac|aac|mov|avi)$/i)) {
    return;
  }

  // React Server Components requests (_rsc query param)
  // Network First so client-side navigation always receives fresh server data.
  if (url.searchParams.has('_rsc')) {
    event.respondWith(
      caches.open(RSC_CACHE).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        } catch {
          return cache.match(request) || new Response('', { status: 503, statusText: 'Service Unavailable' });
        }
      })
    );
    return;
  }

  // Navigation requests (HTML pages) - Network First
  if (request.mode === 'navigate') {
    // Special handling for offline page - always fetch from network
    if (url.pathname === OFFLINE_URL) {
      event.respondWith(
        fetch(request).catch(() => {
          return caches.match(OFFLINE_URL);
        })
      );
      return;
    }

    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);

        try {
          const response = await fetch(request);
          if (response.ok) {
            cache.put(request, response.clone());
            return response;
          }
          if (response.status >= 500) {
            return cached || caches.match(OFFLINE_URL);
          }
          return response;
        } catch {
          if (cached) {
            return cached;
          }
          return caches.match(OFFLINE_URL);
        }
      })
    );
    return;
  }

  // Next.js build assets (including JS/CSS) should always be fetched through the
  // browser's normal cache semantics. Avoid SW-level caching so deploys don't keep
  // serving stale application bundles.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets from the public root - Cache First
  if (
    url.pathname.match(/\.(woff2?|png|jpg|jpeg|gif|svg|webp|ico)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // Not in cache, fetch and cache
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch((error) => {
            console.error('Failed to fetch static asset:', request.url, error);
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
      })
    );
    return;
  }

  // PWA icons - Stale-While-Revalidate with long-term fallback
  if (url.pathname.startsWith('/pwa/icon-')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            if (response.status >= 500 && cachedResponse) {
              return cachedResponse;
            }
            return response;
          })
          .catch(() => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });

        // Return cached version immediately (if exists), then update in background
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // PWA Manifest - Stale-While-Revalidate
  if (url.pathname === '/pwa/manifest.json') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            if (response.status >= 500 && cachedResponse) {
              return cachedResponse;
            }
            return response;
          })
          .catch(() => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(
              JSON.stringify({
                name: 'Ciel',
                short_name: 'Ciel',
                description: 'A minimal SNS application',
                start_url: '/',
                display: 'standalone',
                background_color: '#f7f7f7',
                theme_color: '#f7f7f7',
                icons: []
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/manifest+json' },
              }
            );
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // API requests and external origins - Network Only
  // APIs must not be cached; data freshness is required
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Network unavailable' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      )
    );
    return;
  }

  // Default: Network only (no caching for unmatched requests)
  // Avoid caching unknown content types that may be large (media, blobs, etc.)
  event.respondWith(fetch(request));
});
