# Orduva Ver-0.203 — Tenant Stripe storefront checkout

This build activates tenant-owned Stripe Checkout for storefront customer orders.

## Important architecture

This does not use the Orduva owner Stripe account. Customer order payments use the tenant/store owner's own Stripe keys saved under Tenant Admin → Store settings → Storefront payment options.

## Added

- Tenant Stripe Checkout session creation for customer orders.
- New webhook endpoint: `/api/storefront/stripe/webhook`.
- Storefront Stripe success and cancel pages.
- Stripe order metadata includes tenant ID, tenant slug and order ID.
- Orders are marked `pending_online_payment` while the customer is on Stripe.
- Webhooks update orders to `paid`, `failed`, `cancelled` or `refunded`.
- Stripe appears on the storefront only when tenant Stripe credentials are saved and enabled.
- The Stripe setup guide now shows the live webhook URL.

## Required Stripe webhook events

- `checkout.session.completed`
- `checkout.session.expired`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

## Supabase SQL

Run `SUPABASE_VER_0_203_TENANT_STRIPE_STOREFRONT_CHECKOUT.sql` before deploying.
