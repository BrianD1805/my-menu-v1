const STORE_CACHE = 'orduva-storefront-runtime-ver-0-176';
const STATIC_CACHE = 'orduva-storefront-static-ver-0-176';
const PAGE_CACHE = 'orduva-storefront-pages-ver-0-176';

const CORE_ASSETS = [
  '/orduva-storefront-icon-192.png',
  '/orduva-storefront-icon-512.png',
  '/orduva-notification-icon-192.png',
  '/orduva-notification-badge-96.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(CORE_ASSETS).catch(() => undefined))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('orduva-storefront-') && ![STORE_CACHE, STATIC_CACHE, PAGE_CACHE].includes(key))
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

function isCacheableStatic(request, url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    /\.(?:png|jpg|jpeg|webp|gif|svg|ico|css|js|woff2?)$/i.test(url.pathname)
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STORE_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response && response.ok) cache.put(request, response.clone()).catch(() => undefined);
    return response;
  }).catch(() => cached);
  return cached || network;
}

async function navigationNetworkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone()).catch(() => undefined);
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw new Error('Navigation unavailable');
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === '/api/products') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (isCacheableStatic(request, url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigationNetworkFirst(request));
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Order update', body: event.data.text() };
  }

  const title = payload.title || 'Order update';
  const options = {
    body: payload.body || 'There is an update for your order.',
    icon: payload.icon || '/orduva-notification-icon-192.png',
    badge: payload.badge || '/orduva-notification-badge-96.png',
    tag: payload.tag || 'orduva-storefront-push',
    data: {
      url: payload.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';

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
