# Orduva Ver-0.196 — billing polish

This patch polishes the Stripe billing admin and return-page wording after the live checkout, webhook, renewal date, and subscription management tests passed.

## Changes

- Bumped visible version to `Ver: 0.196`.
- Bumped service worker/storefront cache strings to `ver-0-196`.
- Improved tenant admin billing status wording:
  - `Orduva tenant` is now presented as `Orduva access`.
  - `Stripe subscription` is now presented as `Stripe billing`.
  - Active subscriptions show clearer `Active — renewing` language.
  - Scheduled cancellations show clear `Paid access ends` wording.
  - Cancelled/failed payment states have clearer labels.
- Added a customer-facing billing summary inside the billing popup.
- Renamed `Safe billing actions` to `Subscription management`.
- Clarified that `Cancel at period end` stops the next renewal but keeps the store active until the paid period ends.
- Cleaned up success/cancel return page wording so they are suitable to leave in production.
- Removed the remaining secondary `View plans` action from the cancel page so return pages do not send users away from admin.
- Updated active admin popup wording to `Subscription active — checkout open`.

## Testing

After deployment, check:

1. Tenant admin header still shows `Active / Billing`.
2. Billing popup shows renewal date and customer-friendly access wording.
3. `Cancel at period end` still schedules cancellation safely.
4. `Keep subscription active` still removes the scheduled cancellation.
5. `/billing/success` still confirms the payment and store activation.
6. `/billing/cancel` confirms no payment was taken and only offers return to admin.

No Supabase SQL is required.
