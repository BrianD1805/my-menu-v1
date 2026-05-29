# Orduva Patch Ver-0.225C — Product Variants Rethink and Stock Foundation

## Summary
This patch reworks the product variants foundation so variants are treated as proper sellable options with final prices, optional descriptions, active/sold-out states, and optional per-variant stock.

## What changed
- Variant options can now store their own stock settings inside the existing product_variants JSON field.
- Tenant Admin product editor now includes per-variant stock controls:
  - Track stock
  - Stock quantity
  - Low stock warning
- Storefront variant popup now uses a softer premium style tied to the tenant palette rather than hard-coded emerald colouring.
- Popup still follows the Orduva storefront popup rules: centred, 35px side spacing, 75px top/bottom spacing, sticky header, sticky footer, scroll-contained body.
- Customers can still choose the standard/base product without the tenant creating a duplicate variant.
- Sold-out variants are disabled in the variant popup while other variants remain available.
- Low-stock variants show an “Only X left” note.
- Checkout/order creation validates stock per sellable line: base product or selected variant.
- Cash/COD order creation reduces the stock for the selected variant only, or the base product stock if the standard product is selected.

## Important implementation note
No new Supabase table is created. Variant stock is stored in the existing `products.product_variants` JSONB field added in Ver-0.225.

## Current scope
This is the variant stock foundation. Product-level stock still applies to the standard/base product. Variant-level stock applies when a customer selects a tracked variant.

## Not changed
- No payment provider configuration logic changed.
- No checkout payment provider logic changed.
- No product card redesign was made.
- No new SQL is required beyond the Ver-0.225 variants SQL if it has not already been applied.
