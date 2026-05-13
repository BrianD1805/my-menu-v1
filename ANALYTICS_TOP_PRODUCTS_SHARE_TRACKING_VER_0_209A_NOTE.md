# Orduva Ver-0.209A — Analytics Top Products + Share Tracking Polish

## Purpose
Polishes the Ver-0.209 analytics foundation so tenants can clearly see which products are being viewed, shared and added to cart.

## Changed files
- `components/analytics/AnalyticsDashboardPanel.tsx`
- `components/menu/ProductCard.tsx`
- `components/menu/MenuBrowser.tsx`
- `lib/analytics.ts`
- `lib/version.ts`
- `public/sw.js`

## What changed
- Adds separate analytics dashboard sections for most viewed products, most shared products and most added-to-cart products.
- Adds a polished product engagement panel combining views, shares and cart adds per product.
- Tracks product views when the customer opens product details from image, title, More button, or a shared product link.
- Ensures search-popup add-to-cart events include product analytics.
- Ensures the search-popup cart button records a checkout-started event before going to checkout.
- Keeps tracking lightweight: no mouse movement, no scroll tracking, no keystrokes and no private form contents.

## Supabase
No new Supabase SQL required. Uses the `analytics_events` table from Ver-0.209.
