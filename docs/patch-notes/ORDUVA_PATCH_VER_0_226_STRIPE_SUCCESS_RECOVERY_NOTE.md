# Orduva Patch Ver-0.226 — Stripe success recovery, paid order wording and variant payload cleanup

## Purpose
Improve the live Stripe paid-order handoff after product variants were added.

## Changes
- Stripe success page now polls for longer and only stops polling once a paid order record is available.
- Stripe checkout-status API can now recover a successful Stripe Checkout Session directly from Stripe and create/link the paid Orduva order when the webhook is delayed.
- Paid WhatsApp order messages now show the correct payment wording and reference instead of `Payment: Offline`.
- Paid provider message wording improved for Stripe, Yoco, Pesapal/M-Pesa and Daraja order creation paths.
- Final-price variants now store `variant_price_delta` as `0` for new orders/cart payloads, keeping the old column as legacy compatibility only.
- Paid stock reduction now handles variant-level stock for Stripe, Yoco, Pesapal/M-Pesa and Daraja paid order creation paths.

## SQL
No Supabase SQL required.

## Guardrails
- No Stripe credentials or payment configuration changed.
- No product card redesign.
- No checkout price calculation changes.
- No custom domain work.
