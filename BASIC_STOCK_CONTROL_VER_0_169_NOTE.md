# Orduva Ver-0.169 — basic stock control

This patch adds a basic stock control system for tenant products.

## Included

- Adds stock fields to `public.products`
- Adds tenant admin stock controls in the product editor
- Allows stock tracking to be turned on/off per product
- Allows stock quantity to be edited per product
- Allows a low-stock warning threshold to be set per product
- Shows stock badges in the tenant admin product list/search results
- Shows in-stock / low-stock / out-of-stock labels on storefront products
- Disables Add buttons for out-of-stock tracked products
- Caps cart quantity increases to available tracked stock
- Reduces tracked product stock when an order is saved
- Adds checkout validation if the cart quantity is higher than available stock

## Not changed

- Product card layout structure
- Checkout design structure
- Wildcard routing
- Public onboarding
- Owner platform access gate
- Favourites table/API
- Storefront theme colour editor

## SQL

Run `supabase/migrations/20260505_basic_stock_control.sql` once before testing this patch.
