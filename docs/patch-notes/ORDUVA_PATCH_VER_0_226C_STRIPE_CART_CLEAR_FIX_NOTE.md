# Orduva Patch Ver-0.226C — Stripe paid cart clear fix

## Purpose
Fix the final remaining Stripe paid-order issue where the card payment completed, the success page displayed correctly, the order was created and variant stock reduced, but the storefront cart stayed populated.

## Changes
- Updated Stripe checkout-status tenant slug reading so it works whether `order_payload` is returned as JSONB object or a JSON string.
- Updated Stripe success page cart clearing to run whenever a paid order is confirmed, even if the tenant slug is temporarily unavailable.
- Added a safe same-origin fallback that clears any `cart:*` Orduva localStorage keys after a confirmed paid Stripe order.
- Dispatches cart update events for the tenant cart and fallback-cleared cart keys.

## Not changed
- No Stripe configuration changed.
- No payment provider setup changed.
- No checkout pricing logic changed.
- No product card UI changed.
- No product variant stock logic changed.
- No Supabase SQL required.
