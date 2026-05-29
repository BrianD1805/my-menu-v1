# Orduva Ver-0.129 — Wildcard Tenant Subdomain Support

This build formalises wildcard tenant subdomain routing for onboarded clients.

## Confirmed structure

- `orduva.com` — Orduva platform landing page
- `admin.orduva.com` — shared tenant admin app
- `zimzaexpress.orduva.com` — ZimZa Express storefront via compatibility alias to existing tenant slug `orduva`
- `<tenant-slug>.orduva.com` — onboarded tenant storefronts, once wildcard domain routing is active in Netlify/DNS

## Notes

The application now resolves tenant storefronts directly from the subdomain slug. Example: `test-cafe.orduva.com` resolves to tenant slug `test-cafe`.

Reserved subdomains such as `admin`, `www`, `api`, `assets`, `static`, and `platform` are excluded from tenant resolution.

No Supabase schema changes are required for this build.
