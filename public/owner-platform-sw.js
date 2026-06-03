const OWNER_PLATFORM_CACHE = "orduva-owner-platform-v0-229g";
const OWNER_PLATFORM_SCOPE = "/platform";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(OWNER_PLATFORM_CACHE).then((cache) =>
      cache.addAll([
        "/platform",
        "/platform/manifest.webmanifest",
        "/orduva-owner-platform-icon-192.png",
        "/orduva-owner-platform-icon-512.png",
      ]).catch(() => undefined)
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("orduva-owner-platform-") && key !== OWNER_PLATFORM_CACHE).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(OWNER_PLATFORM_SCOPE) && !url.pathname.startsWith("/orduva-owner-platform-")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(OWNER_PLATFORM_CACHE).then((cache) => cache.put(request, clone)).catch(() => undefined);
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/platform")))
  );
});
