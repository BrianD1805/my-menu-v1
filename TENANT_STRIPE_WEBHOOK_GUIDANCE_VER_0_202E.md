# Orduva Ver-0.202E — Tenant Stripe webhook setup guidance

## Purpose

This patch improves the tenant Stripe setup guide so non-technical store owners are not asked to create a webhook before Orduva has a live customer-order Stripe endpoint available.

## Changes

- Bumped visible version to Ver: 0.202E.
- Updated the Stripe setup guide popup in Tenant Admin → Store settings → Storefront payment options → Stripe customer payments.
- Added clear guidance that tenant storefront Stripe is for customer order payments, not Orduva subscription billing.
- Added recommended Stripe webhook destination name: Orduva - Customer Orders.
- Shows the webhook endpoint URL as not active yet / coming in the live checkout build.
- Explicitly warns not to use the Orduva owner billing webhook endpoint.
- Lists the storefront payment events to select when the tenant webhook endpoint is live:
  - checkout.session.completed
  - checkout.session.expired
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded
- Adds helper text beside the Tenant Stripe webhook secret field saying the final endpoint URL is not active yet.

## Supabase

No Supabase SQL required.

## Testing

1. Open Tenant Admin → Store settings.
2. Open Storefront payment options.
3. Click Help me find these keys.
4. Confirm the popup explains that the webhook endpoint URL is not active yet.
5. Confirm it lists the event names and destination name.
6. Confirm it warns not to use the Orduva owner billing webhook.
7. Confirm the popup still keeps the sticky header and close button from Ver-0.202B/0.202D.
