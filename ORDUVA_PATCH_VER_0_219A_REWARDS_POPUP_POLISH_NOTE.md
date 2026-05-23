# Orduva Patch Ver-0.219A — Rewards popup centring and desktop width polish

## Summary
Small UI-only polish patch for the storefront rewards popup introduced in Ver-0.219.

## Changes
- Centres the rewards popup vertically and horizontally on mobile and desktop.
- Keeps the popup constrained to the viewport with max-height scrolling inside the popup body.
- Widens the popup on desktop only for a more premium layout.
- Adds mobile-only padding and a subtle translucent panel around the eligible-discount wording to stop it feeling cramped on small screens.
- Adds slightly roomier desktop header/body padding.

## Safety
- No rewards calculation changes.
- No checkout total logic changes.
- No Stripe/Yoco/Pesapal/Daraja payment changes.
- No Supabase SQL required.

## Version
Ver: 0.219A
