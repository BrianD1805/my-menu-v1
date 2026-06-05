# Orduva Patch Ver-0.231F — Checkout product price fix

## Purpose
Restore ordinary product checkout pricing after customer-entered amount payment discovery work.

## Changes
- Added unit/base price snapshots to storefront cart rows when normal products are added.
- Checkout uses the live product price first, then the cart snapshot as a safe fallback.
- Checkout automatically removes stale customer-entered amount payment rows from local cart storage because standalone invoice payments should not use cart checkout.

## No changes
- No payment provider configuration changes.
- No product card redesign.
- No variant stock changes.
- No Supabase SQL required.
