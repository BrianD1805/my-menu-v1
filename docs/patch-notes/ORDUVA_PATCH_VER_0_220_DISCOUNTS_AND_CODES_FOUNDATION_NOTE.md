# Orduva Patch Ver-0.220 — Discounts & Discount Codes Foundation

## Summary
Adds the first Discounts & Discount Codes foundation after the Rewards Programme workstream.

## Included
- Tenant Admin settings section: **Discounts & discount codes**.
- Create multiple discount rules.
- Discount scopes:
  - Site-wide basket discount.
  - Specific product discount.
  - Combination discount for up to 3 selected products.
- Discount types:
  - Percentage.
  - Fixed amount.
- Optional copy/paste discount code.
- Date range fields.
- Active/inactive toggle.
- Show on checkout toggle.
- Feature in loading popup toggle.
- Can/cannot be used with rewards toggle.
- Only this discount applies toggle.
- Storefront welcome offer icon and offers popup.
- Checkout offers panel with icon, code entry, visible offer chips and offers popup.
- Server-side discount calculation in `/api/orders` so customers cannot alter totals client-side.
- Discount-adjusted totals are passed into Stripe, Yoco, Pesapal and Direct M-Pesa/Daraja payment intents.
- Order-level discount audit fields are stored for later reporting.

## Not included yet
- Usage limits per code.
- Customer-specific/private code assignment.
- Owner analytics for discount performance.
- More advanced stacking of multiple promo codes.

## Safety
- Rewards and discounts remain separate.
- If a discount cannot be used with rewards, the server removes the reward amount from the calculation.
- If “Only this discount applies” is enabled, the discount overrides the reward discount.
- No payment provider connection logic was changed.

## SQL
Run `supabase/migrations/2026-05-24_ver_0_220_discounts_and_codes_foundation.sql` before deployment.
