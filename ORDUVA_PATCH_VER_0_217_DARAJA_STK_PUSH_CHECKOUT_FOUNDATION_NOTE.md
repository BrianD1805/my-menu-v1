# Orduva Patch Ver-0.217 — Direct M-Pesa Daraja STK Push checkout foundation

## Purpose
Add the first direct Safaricom Daraja / M-Pesa Express checkout foundation for KES tenants.

This patch starts the STK Push request and records the Safaricom request identifiers, but it deliberately does **not** create an order yet. Paid order creation remains reserved for the next callback/reconciliation patch.

## Key behaviour
- Adds a direct `daraja` storefront payment provider.
- Shows Direct M-Pesa before Pesapal for KES stores when enabled.
- Starts a Safaricom STK Push request from `/api/orders`.
- Normalises Kenyan phone numbers to `2547...` / `2541...` format.
- Stores `MerchantRequestID`, `CheckoutRequestID`, `AccountReference`, phone number and initial STK response on `storefront_payment_intents`.
- Redirects customers to a direct M-Pesa waiting page after the STK Push is accepted.
- Adds a callback intake route that records Daraja callback payloads only; it does not create orders.
- Keeps Stripe, Yoco and Pesapal behaviour untouched.

## Added files
- `lib/storefront-daraja.ts`
- `app/api/storefront/daraja/checkout-status/route.ts`
- `app/api/storefront/daraja/callback/route.ts`
- `app/checkout/payment/daraja/success/page.tsx`
- `app/checkout/payment/daraja/success/DarajaSuccessStatusClient.tsx`
- `supabase/migrations/2026-05-19_ver_0_217_daraja_stk_push_checkout_foundation.sql`

## Updated files
- `app/api/orders/route.ts`
- `app/api/products/route.ts`
- `app/checkout/page.tsx`
- `components/admin/TenantSettingsForm.tsx`
- `lib/storefront-payment-options.ts`
- `lib/version.ts`
- `public/sw.js`
- `supabase/schema.sql`

## SQL required
Run the Ver-0.217 SQL migration before deploying.

## Not included yet
- No paid order creation from Daraja success.
- No stock deduction after Daraja payment yet.
- No admin push notification after Daraja payment yet.
- No customer push notification after Daraja payment yet.
- No manual Daraja diagnostics panel yet.

Those belong in the next patch: Ver-0.218 — Daraja callback and order reconciliation.
