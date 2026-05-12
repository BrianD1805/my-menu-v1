# Orduva Ver-0.205 — Storefront product share links

## Purpose
Adds product sharing from the tenant admin product edit popup without changing owner/platform sign-in, payment settings, Stripe, Yoco, Pesapal, checkout, or product card layout.

## What changed
- Added a share icon button to the tenant admin edit product popup.
- The share action uses the browser's native share sheet where available, so mobile devices can share to WhatsApp, email, messages and other installed apps.
- If native sharing is unavailable, the product share text and link are copied to the clipboard.
- Added product-specific storefront route: `/product/[productId]`.
- Shared product links render product Open Graph/Twitter metadata, including product name, plain-text description and product image when available, so WhatsApp/email previews can show a thumbnail and description where the receiving app supports previews.
- Product links open the storefront and automatically open the matching product details popup.

## Files touched
- app/admin/products/page.tsx
- app/product/[productId]/page.tsx
- components/admin/ProductManager.tsx
- components/menu/ProductCard.tsx
- components/menu/MenuBrowser.tsx
- components/menu/StorefrontClientLoader.tsx
- lib/version.ts
- public/sw.js

## Supabase SQL
No Supabase SQL required for Ver-0.205.

## Testing notes
- Edit an existing product in tenant admin and tap the new share icon near the close button.
- On mobile, confirm the native share sheet opens and allows WhatsApp/email sharing.
- On desktop, confirm sharing opens where supported or copies the product share link.
- Open the shared URL and confirm the storefront loads with that product details popup open.
- Paste the link into WhatsApp/email and confirm the preview uses the product title, description and thumbnail where the app fetches link previews.
