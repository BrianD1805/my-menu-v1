# Orduva Ver-0.192 — Stripe price ID configuration

## Summary

Added owner platform visibility for the 30 Stripe recurring Price IDs needed for Starter/Growth/Pro across ZAR, KES, GBP, USD and EUR, monthly and yearly.

## Added

- `/platform/billing`
- `/api/platform/stripe-prices`
- `components/admin/OwnerStripePriceConfigPanel.tsx`
- `STRIPE_PRICE_ID_CONFIGURATION_VER_0_192.md`

## Updated

- `lib/stripe-checkout.ts` now exposes Stripe price status helpers.
- Owner platform navigation now includes Billing.
- Version/cache bumped to Ver: 0.192.

## SQL

No Supabase SQL required.
