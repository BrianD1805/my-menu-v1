# Orduva Patch Ver-0.221C — Storefront popup premium polish

## Purpose
Standardise storefront popup behaviour so overlays feel consistent, premium and usable on desktop and mobile.

## Changes
- Centred storefront popups vertically and horizontally.
- Added a fixed 35px outer spacing between the popup and the viewport edge.
- Constrained popup height to keep content inside the modal area.
- Kept popup title/header areas fixed at the top of the modal layout.
- Kept bottom action/footer areas fixed and visible while body content scrolls.
- Moved scrollbars into the popup body where applicable.
- Added extra bleed space below sticky headers.
- Added extra bottom bleed space in scrollable modal bodies.
- Improved internal spacing for Rewards, Offers, Search, Product More, favourites login, checkout discount and cart/reminder popups.

## Files touched
- components/menu/MenuBrowser.tsx
- components/menu/ProductCard.tsx
- components/menu/CartButton.tsx
- app/checkout/page.tsx
- lib/version.ts
- public/sw.js

## Not changed
- No product card layout changes outside popup behaviour.
- No rewards calculation changes.
- No discount calculation changes.
- No checkout/payment logic changes.
- No Supabase SQL required.
