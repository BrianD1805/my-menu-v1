# Orduva Ver-0.204D — Tenant Admin Home Card Cleanup

## Scope
Tenant admin home/dashboard only.

## Changes
- Removed the four information/stat panels from the admin home page:
  - Orders
  - New orders
  - Products
  - Categories
- Left the four main navigation panels only:
  - Operations — Orders
  - Catalogue — Products
  - Menu structure — Categories
  - Branding — Settings
- Changed desktop layout to two panels per row.
- Left mobile layout as a single stacked column.
- Added four different soft background shades for the four panels.
- Restyled the Open button as a more premium rounded pill with subtle shadow and arrow.
- Removed unnecessary admin home count queries because the stat cards are no longer shown.
- Bumped live version to Ver: 0.204D.

## Files touched
- app/admin/page.tsx
- lib/version.ts
- TENANT_ADMIN_HOME_CLEANUP_VER_0_204D_NOTE.md

## Supabase
No Supabase SQL required.

## Safety notes
- Owner/platform sign-in was not changed.
- Tenant admin login was not changed.
- Stripe/payment/settings files were not changed.
- Storefront/product cards were not changed.
