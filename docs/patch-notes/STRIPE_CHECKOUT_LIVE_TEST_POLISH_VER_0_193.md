# Orduva Ver-0.193A — Stripe checkout live test polish

## What changed

- Bumped Orduva to `Ver: 0.193A`.
- Added selectable Stripe checkout testing controls inside the tenant admin trial/upgrade popup.
- The admin tester can now choose:
  - Starter, Growth or Pro
  - ZAR, KES, GBP, USD or EUR
  - Monthly or yearly billing
- The Stripe checkout API now returns the selected plan, currency, billing interval, masked Price ID, expected amount and environment key after a successful session is created.
- The Stripe upgrade button now shows clearer loading and error feedback.
- Corrected the `/platform/billing` wording so Stripe Price IDs are described as normal Netlify environment variables, not secret values.
- Bumped storefront/service-worker cache strings to `ver-0-193a`.

## How to test

1. Deploy Ver-0.193A.
2. Confirm `/platform/billing` still shows all 30 Stripe Price IDs as SET.
3. Open a tenant admin, for example `/admin` on the tenant/admin host.
4. Click the Trial/Active/Expired pill in the admin header.
5. In the upgrade section, choose a plan, currency and billing interval.
6. Click `Open Stripe Checkout`.
7. Confirm Stripe opens the correct Checkout page with the matching amount, currency and interval.
8. Click back/cancel from Stripe and confirm Orduva returns to the cancel page without taking payment.
9. Repeat a few spot checks:
   - Starter ZAR monthly
   - Starter ZAR yearly
   - Growth KES monthly
   - Pro GBP yearly
   - Pro USD monthly

## Notes

- Use Stripe Test Mode first if these are test prices.
- The actual Stripe checkout call still requires a logged-in tenant admin because `/api/billing/stripe/checkout` uses the tenant admin session.
- No Supabase SQL changes are required for this patch.
