# Orduva Patch Ver-0.229E — Owner Platform favicon routing and PWA install polish

## Summary
This patch applies the user-supplied Owner Platform favicon/PWA artwork and fixes the platform metadata path so the browser does not continue to pick up Tenant Admin branding when viewing `/platform` on the admin host.

## Changes
- Replaced Owner Platform favicon and PWA icons using `Orduva Admin.png`.
- Kept a full white square canvas to avoid black edges when browsers mask icons.
- Added Owner Platform route-kind handling in middleware.
- Added Owner Platform metadata at root layout level when the platform route is active.
- Updated the Owner Platform logo/icon containers to true circles.
- Improved the install button with visible fallback guidance when the native PWA prompt is unavailable.

## Not changed
- No storefront logic changed.
- No checkout logic changed.
- No payment provider logic changed.
- No Tenant Admin product logic changed.
- No database/schema changes.

## SQL
No Supabase SQL required.
