const OWNER_PLATFORM_SW_VERSION = "orduva-owner-platform-v0-229i";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("orduva-owner-platform-")).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", () => {
  // Owner Platform pages and API calls must always come from the network.
  // This worker exists for installability only; it deliberately does not
  // cache or intercept /platform pages so owner dashboards cannot show stale
  // skeleton/loading screens.
});
