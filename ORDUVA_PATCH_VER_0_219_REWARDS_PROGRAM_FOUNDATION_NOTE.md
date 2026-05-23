# Orduva Patch Ver-0.219 — Rewards Programme Foundation

## Summary
Adds the first customer rewards programme foundation with three tiers: Silver, Gold and Platinum.

## Included
- Tenant Admin rewards settings section.
- Tenant-controlled tier spend requirements and discount percentages.
- Automatic enrolment for customer accounts via `reward_enrolled_at`.
- Customer reward tier calculation from previous qualifying spend.
- Compact rewards pill on the storefront welcome panel.
- Premium rewards information popup showing current tier, discount and spend needed for the next tier.
- Checkout reward discount display for signed-in customers.
- Server-side rewards discount application for all order/payment paths.
- Order-level audit fields for subtotal, reward tier, discount percent, discount amount, spend before and spend after.

## Tier defaults
- Silver: automatic, 0% discount.
- Gold: default spend requirement 1000, default 5% discount.
- Platinum: default spend requirement 2500, default 10% discount.

## Notes
- Discounts/coupon codes are not included in this patch. This patch keeps the rewards calculation separate so discount-code logic can be added cleanly later.
- Rewards are calculated for signed-in customer accounts only. Guest customers can still order, but they do not receive tier tracking or rewards discounts.
- Qualifying spend is based on previous non-cancelled/non-refunded customer orders for the tenant.
- Existing Stripe, Yoco, Pesapal and Direct M-Pesa/Daraja payment flows are preserved.

## SQL
Run `supabase/migrations/2026-05-23_ver_0_219_rewards_program_foundation.sql` before deploying.
