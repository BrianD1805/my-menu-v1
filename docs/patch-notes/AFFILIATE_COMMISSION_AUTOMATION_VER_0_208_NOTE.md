# Orduva Ver-0.208 — Affiliate Commission Credit Automation

## Scope
This patch moves the affiliate/commission workflow forward by making paid Stripe subscription events correctly feed the commission ledger for approved public affiliates and any tenant that introduced them.

## What changed
- Stripe invoice/subscription payment processing now loads affiliate referral fields from `referral_rewards`.
- Automatic Stripe-created `referral_reward_credits` now store:
  - `affiliate_id` for approved public affiliate referrals.
  - `secondary_referrer_tenant_id` for the introducing tenant where applicable.
  - `secondary_reward_rate_percent`.
  - `secondary_reward_amount`.
- Automatic Stripe-created referral reward rows now update `secondary_estimated_monthly_reward`.
- Owner Platform > Referrals now labels affiliate-driven rows as **Approved affiliate** rather than treating every row as a tenant referral.
- Owner Platform > Referrals now shows the 5% tenant introduction share on affiliate referral rows.

## What was deliberately not changed
- No storefront product/card UI changes.
- No tenant admin login changes.
- No owner platform login/security changes.
- No Stripe checkout settings changes.
- No automatic FX conversion yet.

## Supabase
No new Supabase SQL is required for Ver-0.208, provided Ver-0.206 and Ver-0.206A SQL have already been run.
