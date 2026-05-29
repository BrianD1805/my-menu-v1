# Orduva Ver-0.184A — Referral rewards currency

This patch makes referral reward rules and monthly credits default to the referred tenant's storefront currency instead of always falling back to GBP.

## Behaviour

- New tenant referral rewards now read `tenant_settings.currency_code` for the referred tenant.
- The platform referrals API creates missing reward rules using the referred tenant currency.
- Existing reward rules that still show GBP are quietly aligned to the referred tenant currency when they have no monthly subscription amount set yet.
- Manual currency override remains available in `/platform/referrals`.
- Monthly credit entries continue to inherit the saved reward rule currency unless manually overridden.

## Supabase SQL

No required schema changes.

An optional backfill file is included for existing rows: `SUPABASE_VER_0_184A_REFERRAL_REWARDS_CURRENCY_BACKFILL.sql`.
