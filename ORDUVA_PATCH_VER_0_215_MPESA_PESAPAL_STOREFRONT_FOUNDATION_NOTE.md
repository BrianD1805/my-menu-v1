# Orduva Patch Ver-0.215 — M-Pesa via Pesapal Storefront Payment Foundation

## Summary
Adds the first Kenyan storefront payment option: M-Pesa via Pesapal hosted checkout.

## Important
Run the Supabase SQL migration before deploying this patch:

`supabase/migrations/2026-05-16_ver_0_215_mpesa_pesapal_storefront_foundation.sql`

## What changed
- Added tenant Pesapal settings to Tenant Admin settings.
- Added KES-only M-Pesa/Pesapal checkout gating.
- Added Pesapal API token + SubmitOrderRequest checkout creation.
- Added M-Pesa/Pesapal success status polling and cancel page.
- Added Pesapal IPN endpoint for callback/status-change checks.
- Keeps Stripe and Yoco behaviour untouched.

## Testing notes
1. Run the SQL migration in Supabase first.
2. Set tenant currency to KES.
3. Add Pesapal sandbox consumer key, consumer secret and IPN notification ID.
4. Enable M-Pesa setup.
5. Enable Show M-Pesa on customer checkout.
6. Place a storefront order and choose Pay with M-Pesa.
7. Confirm redirect to Pesapal hosted checkout.
8. Complete sandbox payment and confirm the success page creates a paid order.

## IPN URL
Use this URL when registering the tenant IPN URL in Pesapal:

`https://www.orduva.com/api/storefront/mpesa/ipn`

## No npm install
Do not run npm install in the sandbox unless explicitly requested. The user runs npm install/build locally.
