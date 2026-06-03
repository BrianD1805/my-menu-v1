# Orduva Patch Ver-0.229B — Owner Platform menu close, favicon and PWA install

## Summary

This patch polishes the Owner Platform navigation and adds a dedicated Owner Platform app identity.

## Changes

- Owner Platform mega dropdowns now close immediately after a menu link is selected.
- Added a dedicated Owner Platform browser favicon.
- Added new Owner Platform PWA icons with white background, Ord in blue #336699 and uva in black.
- Added /platform/manifest.webmanifest for a standalone Owner Platform PWA scoped to /platform.
- Added an Install app action in the Owner Platform header.
- Registered the existing service worker from the Owner Platform client wrapper so the browser can offer installation where supported.

## No changes

- No storefront logic changed.
- No checkout logic changed.
- No payment provider logic changed.
- No Tenant Admin product logic changed.
- No database/schema changes.

## SQL

No Supabase SQL required.
