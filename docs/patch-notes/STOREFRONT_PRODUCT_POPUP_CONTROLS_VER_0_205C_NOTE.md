# Orduva Ver-0.205C — Storefront product popup share/cart control tidy

## Purpose
Tidy the customer storefront product details popup controls after Ver-0.205B made the share controls too repetitive.

## Changes
- Kept only the large in-popup **Share this product** panel requested by the user.
- Removed the extra top share pill from the product details popup.
- Removed the extra footer share button from the product details popup.
- Added a cart/checkout pill beside the close button in the product details popup header.
- Made the search popup cart pill clickable so it takes the customer straight to checkout.
- The product details popup cart pill also takes the customer straight to checkout.
- Bumped the live version and storefront/service-worker cache strings to Ver-0.205C.

## Files touched
- components/menu/ProductCard.tsx
- components/menu/MenuBrowser.tsx
- components/menu/StorefrontClientLoader.tsx
- lib/version.ts
- public/sw.js

## Supabase
No Supabase SQL required for this patch.
