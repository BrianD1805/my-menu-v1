# Orduva Patch Ver-0.220B — Storefront rewards/offers layout fix

## Purpose
Fix the storefront welcome panel layout after Ver-0.220A.

## Changes
- Restored Offers as its own premium quick-action button when storefront discounts are enabled.
- Kept Rewards on its own separate row, as originally intended.
- Grouped Offers, Favourites and Buy Again together in the compact action row underneath Rewards.
- Centred welcome screen text, buttons and quick-action icons on mobile and desktop.
- Added body/page scroll locking for rewards, offers, favourites-login and search popups so the background no longer scrolls behind open popups.
- Improved reward tier contrast so Silver/Gold/Platinum popup headers and icons remain readable.
- Added an empty-state message inside the Offers popup when discounts are enabled but no visible offers are currently available.

## Not changed
- No discount calculation changes.
- No rewards calculation changes.
- No checkout changes.
- No payment provider changes.
- No Supabase SQL required.

## Version
Ver: 0.220B
