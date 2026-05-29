# Ver-0.172C — Logout tenant resolution and loading separation

## Purpose

Fix two issues found after Ver-0.172B:

1. The premium "We're getting things ready" loader must be used only for the first storefront startup/open experience, not throughout account/logout/app navigation.
2. Logging out from a Netlify deploy-preview URL could redirect to `/` on a host such as `69fb...--orduva.netlify.app`; tenant resolution treated the deploy id as a tenant subdomain, causing `Tenant not found`.

## Changes

- `app/loading.tsx` is now a quiet background-only fallback for route transitions.
- The premium loading message remains in `StorefrontClientLoader` for storefront startup/open only.
- Netlify deploy preview hosts ending in `--orduva.netlify.app` are treated as root preview hosts, not tenant subdomains.
- Storefront local cache version bumped to `ver-0-172C`.
- App version bumped to `Ver: 0.172C`.

## Supabase

No Supabase SQL required.
