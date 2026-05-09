# Orduva Ver-0.191 — Stripe webhook setup

## Endpoint

Add this endpoint in Stripe Developers → Webhooks:

```text
https://www.orduva.com/api/billing/stripe/webhook
```

If testing on Netlify deploy preview, use that preview URL plus:

```text
/api/billing/stripe/webhook
```

## Events to send

Select these events:

```text
checkout.session.completed
invoice.paid
customer.subscription.updated
customer.subscription.deleted
```

## Netlify environment variable

After creating the webhook in Stripe, copy the signing secret and add it to Netlify:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

Keep the existing Stripe variables from Ver-0.190:

```text
STRIPE_SECRET_KEY
ORDUVA_STRIPE_SUCCESS_URL
ORDUVA_STRIPE_CANCEL_URL
STRIPE_PRICE_STARTER_ZAR_MONTHLY
...
```

## What the webhook does

```text
checkout.session.completed
→ stores Stripe customer/subscription ids
→ marks tenant subscription active
→ marks trial converted

invoice.paid
→ marks tenant subscription active
→ records tenant_subscription_payments row
→ creates referral_reward_credits row if the tenant was referred and the reward is active/trial

customer.subscription.updated
→ keeps tenant status in sync with Stripe subscription state

customer.subscription.deleted
→ marks tenant subscription cancelled
```

## Important

Run `SUPABASE_VER_0_191_STRIPE_WEBHOOK_FOUNDATION.sql` before deploying this build.
