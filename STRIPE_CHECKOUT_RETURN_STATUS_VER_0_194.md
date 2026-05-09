# Orduva Ver-0.194 — Stripe checkout success/cancel return pages and subscription status check

## What changed

- Bumped Orduva to `Ver: 0.194`.
- Improved `/billing/success` so it reads the Stripe `session_id`, checks the Stripe checkout session server-side, and compares it with the Orduva tenant subscription record.
- Improved `/billing/cancel` so it clearly shows that no payment was taken and confirms the tested plan/currency/frequency returned correctly.
- Added `/api/billing/stripe/status` for tenant admin users.
- Added a Subscription status check panel inside the admin billing/trial popup.
- The status check shows:
  - Orduva tenant subscription status
  - Stripe subscription status, when linked
  - billing customer/subscription references, masked
  - recent Stripe webhook events
  - recent Stripe payment records
- Bumped storefront/service-worker cache strings to `ver-0-194`.

## Test notes

1. Deploy Ver-0.194.
2. Open a tenant admin.
3. Open the Trial/Billing popup.
4. Start Stripe Checkout.
5. Test cancelling first and confirm `/billing/cancel` opens and says no payment was taken.
6. Start Stripe Checkout again and complete a test payment.
7. Confirm `/billing/success` shows Stripe checkout complete.
8. Return to admin, open the Trial/Billing popup, and press Refresh status.
9. Confirm the Orduva tenant status changes to active once the Stripe webhook has processed.

## Supabase SQL

No new Supabase SQL is required for this patch if the Ver-0.191 Stripe webhook foundation SQL has already been run.
