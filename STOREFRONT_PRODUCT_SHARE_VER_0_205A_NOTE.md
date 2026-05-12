# Orduva Ver-0.205A — Storefront Customer Product Share Correction

This patch corrects Ver-0.205 so the product sharing feature is customer-facing on the storefront, not an admin edit-product workflow.

## What changed
- Added product share controls to the storefront product details popup.
- Added a customer-facing share icon in the product popup header.
- Added a customer-facing Share button in the product popup footer.
- Uses the browser/native Web Share API when available, so mobile users can share to WhatsApp, email, messages and other installed apps.
- Falls back to copying the product link/text to the clipboard when native sharing is not available.
- Added `/product/[productId]` storefront route so shared links can open the correct product details popup.
- Added product metadata for shared links so WhatsApp/email/social previews can use the product title, description and image where the receiving app supports link previews.

## Important correction
The share feature is for end users/customers on the storefront. Tenant admin product editing is not part of this corrected patch.

## Files changed
- app/product/[productId]/page.tsx
- components/menu/ProductCard.tsx
- components/menu/MenuBrowser.tsx
- components/menu/StorefrontClientLoader.tsx
- lib/version.ts
- public/sw.js

## Supabase
No Supabase SQL required.
