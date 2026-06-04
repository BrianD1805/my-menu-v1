# Orduva Patch Ver-0.231E — Checkout back to storefront icon

## Summary
Added a compact Back to storefront icon/button at the top of the checkout page so customers can return to the storefront without using the browser back button.

## Changed
- `app/checkout/page.tsx`
- `lib/version.ts`
- `docs/ORDUVA_PATCH_LOG.md`

## Notes
- The button links to `/` on the current tenant host.
- The cart is preserved; it does not clear checkout contents.
- No payment, product, invoice-payment, or cart logic changed.

## SQL
No Supabase SQL required.
