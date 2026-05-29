# Orduva Patch Ver-0.225B — Variant Popup Standard Product Polish

## Purpose
This patch polishes the storefront product variant picker after Ver-0.225A.

## Changes
- Reworked the variant picker to follow the standard Orduva storefront popup rules.
- Removed the coloured gradient variant picker header and replaced it with the standard soft white/slate/emerald popup shell.
- Preserved 35px side spacing and 75px top/bottom spacing.
- Preserved the sticky header, scroll-contained body, sticky footer and clipped top-edge styling.
- Added a first option for the standard/base product, so customers can add the product exactly as displayed on the menu without the tenant having to create a duplicate variant.
- Variant options still show their option name, optional description and final price.
- The base product option is stored as the normal product cart line without variant metadata.

## What did not change
- No Supabase SQL required.
- No checkout payment logic changed.
- No payment provider logic changed.
- No product card UI redesign was made.
- No receipt logic changed.
- Existing Ver-0.225 / Ver-0.225A product variant data remains compatible.

## Testing
1. Run `npm run build` locally.
2. Run `npm run dev` locally.
3. Open the storefront.
4. Use a product with variants enabled.
5. Click Add.
6. Confirm the variant popup uses the standard Orduva popup style.
7. Confirm the first option adds the standard product exactly as displayed.
8. Confirm selecting a variant adds that variant and its final price to the cart.
