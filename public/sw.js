const CACHE_NAME = "astra-cache-v7";
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

  // 1. Next.js RSC Data Requests (_rsc query param or RSC header)
  // When offline, return 200 OK empty payload so Next.js proceeds with 0ms client-side rendering
  if (
    requestUrl.searchParams.has("_rsc") ||
    event.request.headers.get("RSC") === "1"
  ) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response("{}", {
            status: 200,
            headers: { "Content-Type": "text/x-component" },
          }),
      ),
    );
    return;
  }

  // 2. Bypass API endpoints from SW cache (handled directly by Zustand RAM + IndexedDB)
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: "Offline" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    return;
  }

  // 3. Navigation Requests (Page Visits & Cold Boots)
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
          // Network failed (Offline / Airplane Mode) -> Serve cached HTML
          const cachedRoute = await caches.match(event.request);
          if (cachedRoute) return cachedRoute;

          const cachedRoot = await caches.match("/");
          if (cachedRoot) return cachedRoot;

          const cache = await caches.open(CACHE_NAME);
          const keys = await cache.keys();
          for (const key of keys) {
            const res = await cache.match(key);
            if (res && res.headers.get("content-type")?.includes("text/html")) {
              return res;
            }
          }

          return new Response(
            `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Project Astra</title></head><body><div id="root"></div></body></html>`,
            { headers: { "Content-Type": "text/html" } },
          );
        }),
    );
    return;
  }

  // 4. Cache-First Strategy for JS Chunks, CSS, Fonts, Images & Manifest
  if (
    requestUrl.pathname.startsWith("/_next/static/") ||
    requestUrl.pathname === "/manifest.webmanifest" ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot|css|js|webmanifest)$/i.test(
      requestUrl.pathname,
    )
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => new Response("", { status: 200 }));
      }),
    );
    return;
  }

  // 5. Default fetch fallback
  event.respondWith(
    fetch(event.request).catch(() => new Response("", { status: 200 })),
  );
});
