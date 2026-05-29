# Orduva Patch Ver-0.220C — Storefront actions and popup controls

## Summary
Refines the storefront rewards/offers/favourites/buy-again presentation after Ver-0.220B.

## Changes
- Mobile: rewards returns to a wider centred button on its own row.
- Mobile: Offers, Favourites and Buy Again sit in one aligned three-column row.
- Mobile: action labels now stay on one line and use the same small weight style as the View/Hide text.
- Mobile: welcome screen action text, icons and buttons are centred.
- Removed the visible outer green border from the compact icon buttons.
- Desktop: rewards/offers/favourites/buy-again actions are removed from the welcome panel and shown in the header on the left-hand side.
- Added tenant theme controls for welcome action text, action icon colour, icon background and rewards button edge.
- Added tenant theme controls and live preview examples for rewards popup and offers popup colours.
- Popup background scroll lock remains in place.

## Payment/order logic
No payment, reward calculation, discount calculation, product card or order logic was changed.

## Supabase SQL
No Supabase SQL required.
