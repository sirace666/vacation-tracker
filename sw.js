const CACHE_VERSION = "1.8";
const CACHE_NAME = "vacation-tracker-v" + CACHE_VERSION;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Always go to the network first for the HTML shell, so a new deployment
  // is picked up immediately instead of serving a stale cached index.html.
  const isNavigation = event.request.mode === "navigate";

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const networkResponse = await fetch(event.request, isNavigation ? { cache: "no-store" } : {});
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (isNavigation) {
          const fallback = await cache.match("./index.html");
          if (fallback) return fallback;
        }
        throw err;
      }
    })
  );
});
