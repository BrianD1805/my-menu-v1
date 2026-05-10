# Orduva Ver-0.195 — subscription management basics

## Purpose
Adds basic live Stripe subscription management inside the tenant admin billing popup.

## Included
- Tenant admin billing popup now shows a clearer renewal/access-end date from Stripe.
- Added safe billing actions:
  - Cancel at period end.
  - Keep subscription active / undo a scheduled cancellation.
- Cancellation is deliberately safe: it sets Stripe `cancel_at_period_end=true` rather than deleting access immediately.
- The tenant remains active until Stripe reaches the end of the paid period.
- The status panel shows when cancellation is scheduled.
- Added API endpoint: `/api/billing/stripe/subscription`.
- Bumped visible version to `Ver: 0.195`.
- Bumped service worker/storefront cache strings to `ver-0-195`.

## Testing
1. Open tenant admin.
2. Open the Active/Billing popup.
3. Confirm the Stripe subscription panel shows the next renewal date.
4. Tick the confirmation checkbox and click **Cancel at period end**.
5. Confirm Stripe shows cancellation scheduled at period end.
6. Confirm Orduva status still shows active, with cancellation scheduled.
7. Click **Keep subscription active**.
8. Confirm Stripe cancellation schedule is removed and the tenant remains active.

## SQL
No new Supabase SQL is required.
