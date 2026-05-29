# Orduva Ver-0.205D — Product Popup Add-to-Cart Animation Target

This patch keeps the product share/cart popup controls from Ver-0.205C and adjusts the add-to-cart animation target for product details popups.

## Change

- When a customer taps **Add** from the product details popup, the flying product animation now travels to the cart/checkout pill inside that popup.
- Product card add-to-cart animation still travels to the main storefront header cart button.
- Search popup add-to-cart animation still travels to the search popup cart pill.
- The popup cart pill still opens checkout.

## Files touched

- `components/menu/ProductCard.tsx`
- `components/menu/MenuBrowser.tsx`
- `lib/version.ts`
- `public/sw.js`

## Supabase

No Supabase SQL required.
