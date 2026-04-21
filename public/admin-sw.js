self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Minimal admin service worker for PWA installability and push foundation.
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Orduva Admin', body: event.data.text() };
  }

  const title = payload.title || 'Orduva Admin';
  const options = {
    body: payload.body || 'You have a new admin notification.',
    icon: payload.icon || '/orduva-admin-icon-192.png',
    badge: payload.badge || '/orduva-admin-icon-192.png',
    tag: payload.tag || 'orduva-admin-push',
    data: {
      url: payload.url || '/admin/orders',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/admin/orders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
