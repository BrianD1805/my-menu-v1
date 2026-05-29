# Orduva Patch Ver-0.225 — Product Variants Foundation

Adds product variants for tenant products, including sizes, weights, colours, flavours and other customer-selectable options.

## Included

- Tenant product editor variant section.
- Variant popup on storefront add-to-cart flow using the existing premium popup rules.
- Variant-aware cart lines.
- Variant-aware checkout summary and order creation.
- Variant fields stored on order_items.
- Product-level stock remains product-wide, not per variant.

## SQL

Run `supabase/migrations/2026-05-29_ver_0_225_product_variants_foundation.sql` before testing variants.

No new public table is created, so no new service_role GRANT is needed for this patch.

## Guardrails

- No checkout payment provider logic was changed.
- No product card visual layout was redesigned.
- Product-level stock remains the source of truth across all variants.
