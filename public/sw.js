const CACHE_NAME = "astra-cache-v4";
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

  // 1. Universal Offline Navigation Caching Strategy
  // Allows opening ANY dynamic page (/students/[id], /vault/[id], /custom-fields/[id]) offline!
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
              cache.put("/", responseToCache.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline / Airplane Mode fallback:
          // Try specific cached route first, then root shell, then any HTML response in CacheStorage
          const exactMatch = await caches.match(event.request);
          if (exactMatch) return exactMatch;

          const rootMatch = await caches.match("/");
          if (rootMatch) return rootMatch;

          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          for (const key of keys) {
            const res = await cache.match(key);
            if (res && res.headers.get("content-type")?.includes("text/html")) {
              return res;
            }
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Astra Offline</title></head><body><div id="root"></div></body></html>`,
            { headers: { "Content-Type": "text/html" } },
          );
        }),
    );
    return;
  }

  // 2. Bypass API endpoints from SW cache (handled directly by Zustand RAM + IndexedDB)
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
