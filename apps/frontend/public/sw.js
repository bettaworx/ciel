// Service Worker for Ciel PWA
// Implements hybrid caching strategy for optimal offline experience

const CACHE_VERSION = "v5";
const STATIC_CACHE = `ciel-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `ciel-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// Assets to precache on install
const PRECACHE_URLS = ["/", "/offline", "/pwa/manifest.json"];

// Install event: Precache critical assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Activate immediately
        return self.skipWaiting();
      }),
  );
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versions of our caches
              return (
                (cacheName.startsWith("ciel-static-") ||
                  cacheName.startsWith("ciel-dynamic-") ||
                  // Retired in the Vite migration; drop any left behind.
                  cacheName.startsWith("ciel-rsc-")) &&
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE
              );
            })
            .map((cacheName) => caches.delete(cacheName)),
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      }),
  );
});

// Fetch event: Route requests based on type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Skip Range requests (video/audio seeking) - never cache partial content
  if (request.headers.get("range")) {
    return;
  }

  // Media files - Network Only (large files should not be buffered or cached)
  if (url.pathname.match(/\.(mp4|webm|ogg|mp3|wav|flac|aac|mov|avi)$/i)) {
    return;
  }

  // Cross-origin images - let the browser handle them. Media and link-preview
  // thumbnails are served by the backend, so they would otherwise fall into the
  // API/external branch below and be answered with a JSON error on failure.
  if (request.destination === "image" && url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests (HTML pages) - Network First
  if (request.mode === "navigate") {
    // Special handling for offline page - always fetch from network
    if (url.pathname === OFFLINE_URL) {
      event.respondWith(
        fetch(request).catch(() => {
          return caches.match(OFFLINE_URL);
        }),
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
      }),
    );
    return;
  }

  // Hashed build assets are already immutable and long-cached by the browser;
  // keeping them out of the SW means a deploy is never served stale bundles.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets from the public root - Cache First
  if (url.pathname.match(/\.(woff2?|png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
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
            console.error("Failed to fetch static asset:", request.url, error);
            return new Response("", { status: 503, statusText: "Service Unavailable" });
          });
      }),
    );
    return;
  }

  // PWA Manifest - Stale-While-Revalidate
  if (url.pathname === "/pwa/manifest.json") {
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
                name: "Ciel",
                short_name: "Ciel",
                description: "A minimal SNS application",
                start_url: "/",
                display: "standalone",
                background_color: "#f7f7f7",
                theme_color: "#f7f7f7",
                icons: [
                  { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
                  { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
                ],
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/manifest+json" },
              },
            );
          });

        return cachedResponse || fetchPromise;
      }),
    );
    return;
  }

  // API requests and external origins - Network Only
  // APIs must not be cached; data freshness is required
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ error: "Network unavailable" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    return;
  }

  // Default: Network only (no caching for unmatched requests)
  // Avoid caching unknown content types that may be large (media, blobs, etc.)
  event.respondWith(fetch(request));
});
