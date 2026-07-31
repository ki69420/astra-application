const CACHE_NAME = "astra-cache-v8";

function cleanResponse(response) {
  if (!response || !response.redirected) return response;
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        try {
          const res = await fetch("/");
          if (res && res.status === 200) {
            await cache.put("/", cleanResponse(res.clone()));
          }
        } catch {
          // Ignore install fetch failure
        }
      })
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

  // 2. Bypass API endpoints from SW cache
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
  // Strips response.redirected === true to prevent iOS Safari & Android Chrome ERR_FAILED crashes
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.match("/").then(async (cachedRoot) => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cleaned = cleanResponse(networkResponse);
            const copy = cleaned.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put("/", copy);
              cache.put(event.request, cleaned.clone());
            });
            return cleaned;
          }
        } catch {
          // Offline / Airplane Mode
        }

        const specificMatch = await caches.match(event.request);
        if (specificMatch) return cleanResponse(specificMatch);
        if (cachedRoot) return cleanResponse(cachedRoot);

        return new Response(
          `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Project Astra</title></head><body><div id="root"></div></body></html>`,
          { headers: { "Content-Type": "text/html" } },
        );
      }),
    );
    return;
  }

  // 4. Cache-First Strategy for Static Assets
  if (
    requestUrl.pathname.startsWith("/_next/static/") ||
    requestUrl.pathname === "/manifest.webmanifest" ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot|css|js|webmanifest)$/i.test(
      requestUrl.pathname,
    )
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cleanResponse(cachedResponse);
        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cleaned = cleanResponse(networkResponse);
              const copy = cleaned.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, copy);
              });
              return cleaned;
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
