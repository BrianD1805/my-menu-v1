# Orduva Patch Ver-0.220D — Loading, rewards panel and softer popups

## Summary
Refines the storefront welcome/action loading sequence after the Ver-0.220 rewards and offers work.

## Changes
- Keeps the early “We’re getting things ready” preloader visible until the storefront has loaded customer chrome, rewards and action icons.
- Reveals the rewards action first, then the Offers / Favourites / Buy Again row shortly afterwards.
- Turns the mobile rewards action into a wider premium panel showing the current tier and spend needed to reach the next tier.
- Softens Rewards and Offers popup colours by blending tenant-selected popup colours into gentler shades while preserving tenant palette influence.
- Improves popup contrast so light silver/white combinations remain readable.
- Updates the storefront cache version and service worker cache names.

## SQL
No Supabase SQL required.

## Payment logic
No payment, rewards calculation, discount calculation, product card, Stripe, Yoco, Pesapal or Daraja order logic was changed.
