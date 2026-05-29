# Orduva Ver-0.185B — storefront/admin session isolation

This patch keeps the platform 2FA/session work isolated from customer and tenant admin sessions.

Changes:
- Customer and tenant admin session cookies now include both maxAge and expires so mobile/PWA browsers have an explicit persistent expiry.
- Customer login/signup fetches explicitly include same-origin credentials and no-store.
- The service worker no longer handles/caches session-sensitive areas: /account, /admin, /platform, /checkout, /api/customer, /api/admin, and /api/platform.
- Service worker cache version bumped to Ver-0.185B.

No Supabase SQL required.
