// Service Worker for Ciel PWA
// Implements hybrid caching strategy for optimal offline experience

const CACHE_VERSION = 'v3';
const STATIC_CACHE = `ciel-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ciel-dynamic-${CACHE_VERSION}`;
const RSC_CACHE = `ciel-rsc-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// RSC cache TTL: 5 minutes
const RSC_TTL_MS = 300_000;

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

  // React Server Components requests (_rsc query param)
  // Stale-While-Revalidate with 5-minute TTL for fast client-side navigation
  if (url.searchParams.has('_rsc')) {
    event.respondWith(
      caches.open(RSC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((res) => {
          if (res.ok) {
            cache.put(request, res.clone());
          }
          return res;
        });

        if (cached) {
          // Check TTL (5 minutes)
          const date = cached.headers.get('date');
          const age = date ? Date.now() - new Date(date).getTime() : Infinity;
          if (age < RSC_TTL_MS) {
            // Serve from cache immediately, update in background
            fetchPromise.catch(() => {});
            return cached;
          }
        }

        // Cache expired or not cached: fetch from network
        return fetchPromise;
      })
    );
    return;
  }

  // Navigation requests (HTML pages) - Stale-While-Revalidate
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
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res.ok) {
              cache.put(request, res.clone());
              return res;
            }
            // If server error (5xx), fall back to cache or offline page
            if (res.status >= 500) {
              return cached || caches.match(OFFLINE_URL);
            }
            return res;
          })
          .catch(() => cached || caches.match(OFFLINE_URL));

        // Serve from cache immediately if available, update in background
        if (cached) {
          fetchPromise.catch(() => {});
          return cached;
        }

        return fetchPromise;
      })
    );
    return;
  }

  // Static assets (JS, CSS, images from _next/static or root) - Cache First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|webp|ico)$/i)
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

  // Default: Network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
