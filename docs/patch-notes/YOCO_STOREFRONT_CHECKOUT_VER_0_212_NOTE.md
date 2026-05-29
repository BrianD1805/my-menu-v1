# Orduva Ver-0.212 — Yoco Storefront Checkout Foundation

Foundation patch for South African/ZAR tenant storefront Yoco checkout.

## Added
- Tenant storefront checkout can now start a hosted Yoco checkout when the tenant has Yoco enabled, connected and live.
- Yoco creates a pending `storefront_payment_intents` record before redirecting the customer.
- Customer is redirected to Yoco's hosted payment page.
- Yoco success/cancel/failure return pages added.
- Success page checks Yoco checkout status and creates the paid order once Yoco confirms payment.
- Stock reduction, admin/customer notification events and WhatsApp message generation follow the same paid-order pattern as Stripe.

## Not included yet
- Dedicated Yoco webhook endpoint/signature verification. This should be the next hardening patch.
- Owner dashboard Yoco reporting polish.

## Supabase
Run `SUPABASE_VER_0_212_YOCO_STOREFRONT_CHECKOUT_FOUNDATION.sql` before deploying.
