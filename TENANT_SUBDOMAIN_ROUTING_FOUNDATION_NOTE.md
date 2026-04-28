# Orduva Ver-0.125 — Tenant Storefront Subdomain Routing Foundation

## Purpose
This patch adds the foundation for tenant storefronts to resolve from subdomains.

The target structure is:

- `orduva.com` — Orduva platform/root site in a later build
- `admin.orduva.com` — shared Orduva admin app
- `zimzaexpress.orduva.com` — ZimZa Express storefront
- future tenants: `<tenant-slug>.orduva.com`

## What changed

- Added cleaner tenant subdomain parsing in `lib/tenant.ts`
- Reserved admin/root hostnames so they are not treated as tenant storefront subdomains
- Added aliases so both of these resolve to the current ZimZa Express tenant slug:
  - `zimzaexpress.orduva.com`
  - `zimza-express.orduva.com`
- Preserved local fallback behaviour for `localhost:3000`
- Preserved `demo.localhost` → `demo`
- Added support for local subdomain-style testing such as `zimzaexpress.localhost:3000` where the browser/environment supports it

## Important current limitation

ZimZa Express currently still appears to use the Supabase tenant slug `orduva`. This patch maps `zimzaexpress` to `orduva` as a compatibility alias.

Later, when onboarding is improved, the cleaner long-term structure should be:

- tenant name: `ZimZa Express`
- tenant slug: `zimzaexpress`
- storefront: `zimzaexpress.orduva.com`

At that point the alias can be removed after the database tenant slug is migrated safely.

## What was not changed

- Product cards
- Add-to-cart animation
- Admin product manager
- Customer accounts
- Checkout/order persistence
- Push notifications
- Payment/provider setup
- Full client onboarding

## DNS / Netlify note

For real live testing, Netlify/DNS must point the tenant subdomain to the same app.
The ideal production setup is a wildcard domain:

```text
*.orduva.com
```

That way future storefronts work automatically once their tenant slug exists.
