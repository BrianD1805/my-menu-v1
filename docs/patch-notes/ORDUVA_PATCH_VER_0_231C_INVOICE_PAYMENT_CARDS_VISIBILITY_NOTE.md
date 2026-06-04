# Orduva Patch Ver-0.231C — Invoice Payment Cards Visibility Fix

This patch fixes the dedicated invoice/payment cards not showing on the storefront after the tenant enabled Invoice payments and created customer-entered amount products.

## Cause

The products API was returning products and most storefront settings, but it was not returning the new Invoice payments settings in the payload consumed by the storefront. The storefront therefore treated `invoicePaymentsEnabled` as false/undefined.

## Changes

- Added invoice payment settings to `/api/products` storefront payload.
- Bumped storefront local cache version to `ver-0-231c`.
- Changed the storefront products fetch to `no-store` and added a cache-busting version parameter.
- Changed `/api/products` response cache control to `no-store` so Tenant Settings changes show immediately.

## SQL

No Supabase SQL required.

## Testing

1. Tenant Admin → Settings → Invoice payments → enable.
2. Tenant Admin → Products → create active customer-entered amount products.
3. Open storefront and hard refresh once.
4. Confirm the invoice/payment cards appear in the first storefront section.
