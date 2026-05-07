# Orduva Ver-0.175 — Free trial foundation

## Scope

Adds the free trial infrastructure foundation for Orduva using a 7-day trial.

## Included

- New Supabase SQL file: `SUPABASE_VER_0_175_FREE_TRIAL_FOUNDATION.sql`
- New helper: `lib/trial.ts`
- Automatic trial fields when a tenant is created through:
  - public onboarding: `/api/public/tenants`
  - platform onboarding: `/api/platform/tenants`
  - admin tenant creation: `/api/admin/tenants`
- Trial length: 7 days
- Default trial state: active
- Default subscription state: trial
- Default plan name: orduva_trial

## Not included yet

- No payment provider integration yet.
- No admin trial banner yet.
- No storefront checkout blocking yet.
- No automatic expiry enforcement yet.

## SQL

Run `SUPABASE_VER_0_175_FREE_TRIAL_FOUNDATION.sql` in Supabase before deploying this patch.
