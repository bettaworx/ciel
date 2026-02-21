// Service Worker for Ciel PWA
// Implements hybrid caching strategy for optimal offline experience

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `ciel-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ciel-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/api/manifest.json',
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
              cacheName.startsWith('ciel-dynamic-')
            ) && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE;
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

  // React Server Components requests (_rsc query param) - always fetch from network
  if (url.searchParams.has('_rsc')) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    // Special handling for offline page - always fetch from network
    if (url.pathname === OFFLINE_URL) {
      event.respondWith(
        fetch(request).catch(() => {
          // If network fails for /offline, return cached version
          return caches.match(OFFLINE_URL);
        })
      );
      return;
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          // If response is OK, cache and return it
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          }
          
          // If server error (5xx) or service unavailable, show offline page
          if (response.status >= 500) {
            return caches.match(request).then((cachedResponse) => {
              return cachedResponse || caches.match(OFFLINE_URL);
            });
          }
          
          // For other errors (4xx, etc.), return the error response
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            // Return cached page or offline page
            return cachedResponse || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images from _next/static or root)
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
            // Return a minimal error response instead of throwing
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
      })
    );
    return;
  }

  // PWA icons - Cache first with long-term fallback
  // Use cached version even if stale when server is offline
  if (url.pathname === '/api/pwa-icon-192' || url.pathname === '/api/pwa-icon-512') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            // Update cache if server returns OK
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            // If server error (5xx) but we have cache, use cache instead
            if (response.status >= 500 && cachedResponse) {
              return cachedResponse;
            }
            return response;
          })
          .catch(() => {
            // Network failed - use cache even if stale
            if (cachedResponse) {
              return cachedResponse;
            }
            // No cache available, return error
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
        
        // Return cached version immediately (if exists), then update in background
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Manifest.json - Cache first with stale-while-revalidate
  // Use cached version even if stale when server is offline
  if (url.pathname === '/api/manifest.json') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            // Update cache if server returns OK
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            // If server error (5xx) but we have cache, use cache instead
            if (response.status >= 500 && cachedResponse) {
              return cachedResponse;
            }
            return response;
          })
          .catch(() => {
            // Network failed - use cache even if stale
            if (cachedResponse) {
              return cachedResponse;
            }
            // No cache available, return minimal fallback
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
        
        // Return cached version immediately (if exists), then update in background
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // API requests (frontend API routes or backend API)
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for 5 minutes
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache (5-minute fallback)
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              // Check cache age (5 minutes = 300,000 ms)
              const cacheDate = cachedResponse.headers.get('date');
              if (cacheDate) {
                const age = Date.now() - new Date(cacheDate).getTime();
                if (age < 300000) {
                  return cachedResponse;
                }
              }
            }
            // Cache too old or not found, return error response
            return new Response(
              JSON.stringify({ error: 'Network unavailable' }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
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
