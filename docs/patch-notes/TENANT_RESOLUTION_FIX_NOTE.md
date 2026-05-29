# Ver-0.116B

This patch strengthens storefront tenant resolution for order saves.

## What changed
- The storefront now passes `tenantId` into `MenuBrowser`.
- `MenuBrowser` stores the active `tenantSlug` and `tenantId` in localStorage.
- Checkout reads the active tenant from localStorage first, then falls back to host resolution.
- `/api/orders` now accepts `tenantId` and prefers it for tenant lookup, while still validating the submitted tenant slug.

## Why
This avoids local fallback/default tenant issues causing orders to save under the wrong tenant.
