# Orduva Patch Ver-0.218 — Daraja callback and order reconciliation

## Summary
Adds direct Safaricom M-Pesa / Daraja reconciliation after the Ver-0.217 STK Push foundation.

When Safaricom posts a successful callback with `ResultCode = 0` and an M-Pesa receipt number, Orduva now creates the real order, marks the payment intent as paid, links the order to the payment intent, writes the WhatsApp order message, reduces stock, and triggers admin/customer notification events and admin push notifications.

## Safety
- Stripe untouched.
- Yoco untouched.
- Pesapal untouched.
- Direct M-Pesa order creation only happens when Safaricom confirms success with `daraja_result_code = 0` and `daraja_mpesa_receipt_number` is present.
- Duplicate callbacks are guarded by the payment intent `order_id` claim path.
- Failed or cancelled Daraja callbacks remain marked failed and do not create orders.

## Key files
- `lib/storefront-daraja.ts`
- `app/api/storefront/daraja/callback/route.ts`
- `app/api/storefront/daraja/checkout-status/route.ts`
- `app/checkout/payment/daraja/success/DarajaSuccessStatusClient.tsx`
- `lib/version.ts`
- `public/sw.js`

## SQL
Run `supabase/migrations/2026-05-19_ver_0_218_daraja_callback_order_reconciliation.sql` before deploying Ver-0.218. It updates the existing orders payment-provider check constraint so paid orders can be stored with `payment_provider='daraja'`.
