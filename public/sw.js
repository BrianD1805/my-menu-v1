const STORE_CACHE = 'orduva-storefront-runtime-ver-0-204D';
const STATIC_CACHE = 'orduva-storefront-static-ver-0-204D';
const PAGE_CACHE = 'orduva-storefront-pages-ver-0-204D';

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


function isSessionSensitivePath(url) {
  return (
    url.pathname === '/account' ||
    url.pathname.startsWith('/account/') ||
    url.pathname === '/admin' ||
    url.pathname.startsWith('/admin/') ||
    url.pathname === '/platform' ||
    url.pathname.startsWith('/platform/') ||
    url.pathname === '/checkout' ||
    url.pathname.startsWith('/checkout/') ||
    url.pathname === '/billing' ||
    url.pathname.startsWith('/billing/') ||
    url.pathname.startsWith('/api/customer/') ||
    url.pathname.startsWith('/api/admin/') ||
    url.pathname.startsWith('/api/platform/') ||
    url.pathname.startsWith('/api/billing/')
  );
}

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

function normalizedNavigationRequest(request) {
  const url = new URL(request.url);
  // Cache navigations without tracking/query params so PWA start_url
  // /?source=pwa&app=storefront can reuse the cached / shell.
  return new Request(url.origin + url.pathname, {
    method: 'GET',
    headers: request.headers,
    mode: 'same-origin',
    credentials: 'same-origin',
    redirect: 'follow',
  });
}

function timeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Navigation network timeout')), ms);
  });
}

function openingFallbackResponse() {
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Opening Orduva</title>
  <style>
    html,body{margin:0;min-height:100%;font-family:Arial,Helvetica,sans-serif;background:linear-gradient(135deg,#fff7f0,#f5f2ee,#fffaf4);color:#111827;}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;text-align:center;}
    .card{max-width:330px}.mark{width:76px;height:76px;margin:0 auto;border-radius:999px;background:rgba(255,255,255,.84);border:1px solid rgba(255,106,61,.24);box-shadow:0 22px 58px rgba(15,23,42,.14);position:relative}.mark:before{content:"";position:absolute;inset:15px;border:4px solid rgba(255,106,61,.13);border-radius:999px}.mark:after{content:"";position:absolute;inset:15px;border:4px solid transparent;border-top-color:#ff6a3d;border-right-color:rgba(255,106,61,.48);border-radius:999px;animation:spin .86s linear infinite}.dot{position:absolute;left:50%;top:50%;width:10px;height:10px;transform:translate(-50%,-50%);border-radius:999px;background:#ff6a3d;box-shadow:0 0 0 8px rgba(255,106,61,.10)}p{margin:22px 0 0;font-size:11px;font-weight:900;letter-spacing:.26em;text-transform:uppercase;color:#b74a16}h1{margin:8px 0 0;font-size:25px;line-height:1.12;font-weight:900;letter-spacing:-.03em}.small{margin-top:12px;font-size:13px;line-height:1.6;color:#64748b;letter-spacing:0;text-transform:none;font-weight:700}@keyframes spin{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <main class="card" role="status" aria-live="polite">
    <div class="mark" aria-hidden="true"><span class="dot"></span></div>
    <p>Orduva</p>
    <h1>We're getting things ready.</h1>
    <div class="small">Connection is taking longer than usual. Trying again…</div>
  </main>
  <script>setTimeout(function(){ location.reload(); }, 1800);</script>
</body>
</html>`, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function navigationFastFallback(request) {
  const cache = await caches.open(PAGE_CACHE);
  const normalizedRequest = normalizedNavigationRequest(request);
  const cached = await cache.match(normalizedRequest) || await cache.match(request);

  const network = fetch(request).then((response) => {
    if (response && response.ok) {
      cache.put(normalizedRequest, response.clone()).catch(() => undefined);
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  });

  // For installed PWAs, return the cached shell immediately so Android does not
  // sit on the native splash while Netlify/Next warms up. Refresh in background.
  if (cached) {
    network.catch(() => undefined);
    return cached;
  }

  try {
    return await Promise.race([network, timeoutPromise(3500)]);
  } catch {
    return openingFallbackResponse();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Ver-0.188A: do not let the storefront PWA cache/session shell touch
  // customer account, tenant admin, platform, checkout, or auth/API areas.
  // These pages must always see fresh cookies/sessions.
  if (isSessionSensitivePath(url)) {
    return;
  }

  if (url.pathname === '/api/products') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (isCacheableStatic(request, url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigationFastFallback(request));
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

// Orduva Ver-0.204D Stripe checkout foundation cache bump
