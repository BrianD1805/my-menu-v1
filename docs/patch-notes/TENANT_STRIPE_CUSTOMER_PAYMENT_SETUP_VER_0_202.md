# Orduva Ver-0.202 — Tenant Stripe customer payment setup foundation

This build adds the foundation for tenant-owned Stripe customer payments on the storefront.

## Important separation

Owner billing is separate from storefront customer payments.

- Orduva owner billing uses the Orduva/ZippyWeb Stripe account for tenant subscriptions.
- Storefront customer payments must use the tenant/business owner's own payment account.

Ver-0.202 therefore does not use the Orduva owner Stripe account for customer storefront orders.

## What changed

- Added tenant Stripe payment settings under Admin > Store settings > Storefront payment options.
- Added fields for tenant-owned Stripe setup:
  - Stripe setup mode
  - account label/business name
  - tenant publishable key
  - tenant secret key
  - tenant webhook secret
  - test/live mode flag
  - setup notes
- Secret key and webhook secret are stored server-side and are not sent back to the browser after save.
- The form shows saved secret hints only.
- Stripe cannot be enabled until the tenant has a publishable key, secret key and webhook secret saved.
- Storefront Stripe remains hidden from customers until the later Stripe order-payment build makes tenant Stripe checkout live.
- Yoco and M-Pesa/Pesapal remain as future provider placeholders.

## SQL required

Run:

`SUPABASE_VER_0_202_TENANT_STRIPE_CUSTOMER_PAYMENT_SETUP.sql`

before deploying Ver-0.202.

## Next build suggestion

Ver-0.203 — tenant Stripe storefront checkout using the tenant's own Stripe credentials, with safe order payment status updates.
