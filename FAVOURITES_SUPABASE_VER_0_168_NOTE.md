# Orduva Ver-0.168 — Supabase customer favourites

This patch adds customer favourites to the storefront.

## Included

- Added a Supabase-backed `customer_favourites` table migration.
- Added `/api/customer/favourites` for signed-in customers to load, add and remove favourites.
- Added favourite heart controls to storefront product cards without changing the core product card layout structure.
- Added a distinct, premium favourites section immediately after the welcome card.
- Favourite cards are visually different from normal product cards.
- Favourite cards sit in a horizontal swipe strip so customers can swipe to view all saved favourites.
- Favourite section only appears when there are saved favourites, or when a save/update message needs to be shown.
- Bumped live version to Ver: 0.168.

## Not changed

- Existing product card layout structure.
- Checkout flow.
- Wildcard routing.
- Public onboarding.
- Owner platform access gate.
- Admin login flow.
