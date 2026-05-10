# Orduva Ver-0.200 — Tenant onboarding-to-paid journey polish

## Purpose
Ver-0.200 polishes the tenant admin flow from trial to paid subscription so it feels like a production activation journey rather than a Stripe test panel.

## Changes
- Bumped visible version to `Ver: 0.200`.
- Bumped storefront/service worker cache strings to `ver-0-200`.
- Reworded tenant billing/trial popup copy from test-style language to live production activation language.
- Added a simple three-step activation path: choose a plan, pay securely, store becomes active.
- Rebuilt the Stripe plan selector into plan cards for Starter, Growth and Pro.
- Kept currency and monthly/yearly controls, but presented them as a polished subscription choice rather than a technical test control.
- Added yearly saving wording in the billing selector.
- Removed the technical `STRIPE_PRICE_...` checkout-attempt display from the normal tenant admin flow.
- Kept Stripe checkout opening in a new window/tab.
- Polished success/cancel page wording so it remains safe and production-ready.

## Acceptance checks
1. Open a tenant admin that is still on trial.
2. Click the Trial/Billing pill in the admin header.
3. Confirm the popup uses production wording and not test wording.
4. Select Starter, Growth and Pro and confirm the selected plan card changes correctly.
5. Change currency and billing interval and confirm the displayed price updates correctly.
6. Click Continue to secure checkout.
7. Confirm Stripe opens in a new window/tab.
8. Cancel checkout and confirm the cancel page still says no payment was taken.
9. Complete a checkout if needed and confirm the success page still activates the tenant.
10. Confirm already-active tenants still show the existing billing management/status panel.

## Notes
No Supabase SQL is required for this patch. This is a tenant admin UX polish patch only.
