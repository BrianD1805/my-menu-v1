# Orduva Ver-0.201A — Storefront cash/COD payment foundation

This patch replaces the abandoned Ver-0.201 storefront payment approach.

## Important architecture correction

Owner billing and storefront customer payments are separate.

- Owner billing: tenants pay Orduva for their subscription. This uses the Orduva owner Stripe account.
- Storefront payments: customers pay the tenant/store owner for orders. These must use the tenant/store owner payment account, not the Orduva owner Stripe account.

Ver-0.201A therefore does not create live Stripe customer checkout sessions.

## Added now

- Cash on collection.
- Cash on delivery.
- Tenant payment provider settings foundation in Store Settings.
- Storefront payment method selection during checkout.
- Smart future provider ordering foundation:
  - KES stores can prioritise M-Pesa/Pesapal when connected.
  - ZAR stores can prioritise Yoco when connected.
  - GBP/USD/EUR stores can prioritise Stripe when connected.
- Order payment tracking fields.
- Tenant admin order payment badges.

## Future providers prepared but not active yet

- Stripe customer payments.
- Yoco customer payments.
- M-Pesa/Pesapal customer payments.

These only appear to storefront customers after a later provider setup build connects the tenant's own provider account.

## SQL required

Run:

SUPABASE_VER_0_201A_STOREFRONT_CASH_COD_PAYMENT_FOUNDATION.sql

before deploying the patch.
