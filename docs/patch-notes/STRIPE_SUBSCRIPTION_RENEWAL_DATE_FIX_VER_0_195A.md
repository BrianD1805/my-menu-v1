# Orduva Ver-0.195A — Stripe subscription renewal date fix

## Purpose
Fix the tenant admin billing popup showing `Next renewal: Not available` for active Stripe subscriptions.

## What changed
- Stripe newer API versions can return the billing period dates on subscription items instead of the top-level subscription object.
- `lib/stripe-status.ts` now reads renewal/access end dates from:
  1. `subscription.current_period_end`, when available; or
  2. `subscription.items.data[].current_period_end`, when Stripe returns item-level periods.
- `cancel_at` display now falls back to the same period-end value when cancellation at period end is scheduled.
- Bumped visible version to `Ver: 0.195A`.
- Bumped service worker/storefront cache strings to `ver-0-195a`.

## Testing
1. Deploy Ver-0.195A.
2. Open tenant admin.
3. Click `Active / Billing`.
4. Click `Refresh status`.
5. Confirm `Next renewal` now shows a real date/time instead of `Not available`.
6. Test `Cancel at period end` and confirm `Access ends` uses the same date.
7. Test `Keep subscription active` and confirm the renewal date remains visible.

## Supabase SQL
No Supabase SQL is required.
