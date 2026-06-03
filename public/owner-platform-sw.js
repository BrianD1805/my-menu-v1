// Orduva Owner Platform Ver-0.229J
// No-op service worker retained only so older registered workers can be replaced/unregistered safely.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("orduva-owner-platform-")).map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});
