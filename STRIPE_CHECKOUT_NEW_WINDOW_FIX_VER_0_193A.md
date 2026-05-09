# Orduva Ver-0.193A — Stripe checkout new-window fix

This small patch keeps the Ver-0.193 Stripe checkout test controls, but changes the checkout handoff so Stripe opens in a new browser window/tab instead of replacing the current Orduva admin tab.

## Changed

- Stripe checkout now opens a blank new window immediately on button click, then redirects that window to the Stripe Checkout URL once the session is created.
- The original Orduva admin tab stays open.
- If the browser blocks the pop-up, the admin UI now shows a clear message asking the user to allow pop-ups for Orduva.
- Updated the Stripe test helper wording from same-tab to new-window behaviour.
- Bumped Orduva to `Ver: 0.193A`.
- Bumped storefront/service-worker cache strings to `ver-0-193a`.

## Test

1. Deploy the patch.
2. Open tenant admin.
3. Click the Trial / Active / Expired pill.
4. Select any plan/currency/frequency.
5. Click Open Stripe Checkout.
6. Confirm Stripe opens in a new window/tab and the original Orduva admin tab remains open.
