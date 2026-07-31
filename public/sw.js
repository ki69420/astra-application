const CACHE_NAME = "astra-cache-v5";
const OFFLINE_ROUTES = [
  "/",
  "/students",
  "/custom-fields",
  "/vault",
  "/documents",
  "/settings",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_ROUTES))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // 1. Cache-First Navigation Strategy for Cold Boots
  // Prevents Android Chrome ERR_FAILED on cold launch without internet!
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        const fallbackResponse =
          cachedResponse ||
          (await caches.match("/")) ||
          (await caches.match("/students"));

        if (fallbackResponse) {
          // In background, revalidate from network if online
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseToCache);
                  cache.put("/", responseToCache.clone());
                });
              }
            })
            .catch(() => {});

          return fallbackResponse;
        }

        // Fallback to network if nothing in cache
        return fetch(event.request).catch(async () => {
          return new Response(
            `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Astra Offline</title></head><body><div id="root"></div></body></html>`,
            { headers: { "Content-Type": "text/html" } },
          );
        });
      }),
    );
    return;
  }

  // 2. Bypass API endpoints from SW cache (handled by Zustand RAM + IndexedDB)
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 3. Cache-First for JS static chunks, CSS, images, and fonts
  if (
    requestUrl.pathname.startsWith("/_next/static/") ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot|css|js)$/i.test(
      requestUrl.pathname,
    )
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // 4. Default network request
  event.respondWith(fetch(event.request));
});
