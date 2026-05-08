# Orduva Ver-0.185 — Referral payment event foundation

## Purpose

Adds a monthly subscription payment event ledger for referred tenants.

Instead of manually creating a referral credit directly, the platform owner can now record the referred tenant's monthly Orduva subscription payment. The system then automatically creates the tenant referral credit using the saved reward percentage.

## Behaviour

- Platform page remains `/platform/referrals`.
- Reward percentage stays changeable per referral.
- Currency stays based on the referred tenant's storefront currency, with manual override still available.
- Manual subscription payment recording is supported now.
- Payment source supports `manual`, `stripe`, `yoco`, `pesapal`, and `owner_adjustment` for later provider webhook integration.
- When a valid subscription payment is recorded, a monthly referral credit is created automatically.
- Duplicate live payment events for the same tenant/month/source are blocked.
- Duplicate referral credits for the same reward/month are still blocked by the existing reward ledger rule.

## Supabase

Run `SUPABASE_VER_0_185_REFERRAL_PAYMENT_EVENT_FOUNDATION.sql` before deploying.

## No storefront changes

This patch affects the owner/platform referral dashboard and server-side platform APIs only. It does not change tenant storefront shopping behaviour.
