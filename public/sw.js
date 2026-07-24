const CACHE_NAME = "astra-cache-v2";
const OFFLINE_URLS = ["/"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  // Never cache navigation, API routes, or Next.js dynamic/RSC requests
  if (
    event.request.mode === "navigate" ||
    requestUrl.pathname.startsWith("/api/") ||
    requestUrl.searchParams.has("_rsc") ||
    event.request.headers.get("RSC") === "1"
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/")),
    );
    return;
  }

  // Only cache static assets under /_next/static/ or images/fonts
  if (
    requestUrl.pathname.startsWith("/_next/static/") ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i.test(requestUrl.pathname)
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
      })
    );
    return;
  }

  // Default: bypass cache for all other dynamic content
  event.respondWith(fetch(event.request));
});

