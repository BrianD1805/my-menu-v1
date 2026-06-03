## Ver-0.229J — Owner Platform blank-page stability rollback

- Paused Owner Platform PWA installation work while platform page stability is restored.
- Removed active Owner Platform service worker registration from the platform layout.
- Added a one-time browser cleanup for Owner Platform pages to unregister old service workers and clear Orduva caches.
- Forced Owner Platform pages to dynamic/no-store rendering to avoid stale skeleton/blank pages.
- Added no-store cache headers for `/platform` routes in middleware.
- No storefront, checkout, payment, Tenant Admin, product, or database changes.
