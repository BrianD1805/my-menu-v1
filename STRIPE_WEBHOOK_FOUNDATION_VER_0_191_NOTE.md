# Orduva Ver-0.191 — Stripe webhook foundation

Adds a Stripe webhook endpoint so successful payments can activate tenants and create referral payment events automatically.

## Added

- `/api/billing/stripe/webhook`
- `lib/stripe-webhook.ts`
- `SUPABASE_VER_0_191_STRIPE_WEBHOOK_FOUNDATION.sql`
- `STRIPE_WEBHOOK_SETUP_VER_0_191.md`

## Events handled

- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Behaviour

- Activates tenant subscription after successful Stripe checkout/payment.
- Converts trial status after successful payment.
- Stores Stripe customer and subscription ids on tenant rows.
- Records Stripe subscription payments in `tenant_subscription_payments`.
- Automatically creates referral reward credits when a referred tenant pays.
- Uses Stripe event log/idempotency table to avoid duplicate processing.
