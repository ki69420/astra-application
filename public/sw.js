const CACHE_NAME = "astra-cache-v12";

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
          const preCacheUrls = [
            "/",
            "/pdf.worker.min.mjs",
            "/manifest.webmanifest",
          ];
          for (const url of preCacheUrls) {
            try {
              const res = await fetch(url);
              if (res && res.status === 200) {
                await cache.put(url, cleanResponse(res.clone()));
              }
            } catch {
              // Ignore individual route fetch failure during install
            }
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
      caches.match(event.request).then(async (cachedRsc) => {
        if (cachedRsc) return cleanResponse(cachedRsc);

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cleaned = cleanResponse(networkResponse);
            const copy = cleaned.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
            return cleaned;
          }
        } catch {
          // Offline / Server closed
        }

        // Return a valid Next.js RSC Flight stream payload (NOT JSON "{}")
        return new Response('0:["$","$L1",null,{}]\n1:[]\n', {
          status: 200,
          headers: { "Content-Type": "text/x-component" },
        });
      }),
    );
    return;
  }

  // 2. API Endpoints: Return 503 (Service Unavailable) when offline so res.ok === false
  if (requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(JSON.stringify({ error: "Offline" }), {
            status: 503,
            statusText: "Service Unavailable (Offline)",
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    return;
  }

  // 3. Navigation Requests (Page Visits & Cold Boots)
  // Always return the clean, neutral Root App Shell ("/") when offline.
  // Never cache or serve stale HTML pages with hardcoded text.
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const cleaned = cleanResponse(networkResponse);
            // Cache root "/" App Shell only
            if (requestUrl.pathname === "/") {
              const copy = cleaned.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put("/", copy);
              });
            }
            return cleaned;
          }
        } catch {
          // Offline / Airplane Mode
        }

        const cachedRoot = await caches.match("/");
        if (cachedRoot) return cleanResponse(cachedRoot);

        return new Response(
          `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Project Astra</title></head><body><div id="root"></div></body></html>`,
          { headers: { "Content-Type": "text/html" } },
        );
      })(),
    );
    return;
  }

  // 4. Cache-First Strategy for Static Assets (JS chunks, CSS, images, icons, fonts)
  if (
    requestUrl.pathname.startsWith("/_next/static/") ||
    requestUrl.pathname === "/manifest.webmanifest" ||
    requestUrl.pathname === "/pdf.worker.min.mjs" ||
    /\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot|css|js|mjs|webmanifest)$/i.test(
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
