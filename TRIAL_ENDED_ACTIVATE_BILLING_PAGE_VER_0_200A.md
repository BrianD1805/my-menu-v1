# Orduva Ver-0.200B — Trial ended activate billing page

## Purpose
This patch replaces the expired-trial billing activation experience with a proper production-style billing activation journey.

## Changes
- Added a dedicated protected tenant admin route:
  - `/admin/billing/activate`
- The desktop route uses the same overall visual format as `/start-your-store`:
  - same Orduva hero/logo shell
  - same warm background treatment
  - same three-column information band
  - same pricing section structure
  - same mobile pricing carousel sizing
- Removed trial wording from the billing activation journey.
- Removed “no payment today” / “no credit card” style wording from the billing activation journey.
- Replaced setup/trial copy with billing activation copy:
  - secure Stripe billing
  - store activation after Stripe confirms payment
  - online subscription management after activation
- Added a reusable client component:
  - `components/admin/BillingActivationJourney.tsx`
- Updated the admin header trial/billing button behaviour for expired unpaid tenants:
  - desktop: opens `/admin/billing/activate`
  - mobile: opens the billing activation journey in a popup
- Mobile popup uses the same pricing carousel sizing as the start-your-store page.
- Stripe Checkout still opens in a new window/tab.
- Bumped visible version to `Ver: 0.200B`.
- Bumped storefront/service worker cache strings to `ver-0-200b`.

## Testing checklist
1. Open an expired unpaid tenant admin on desktop.
2. Click `Expired / Trial` in the admin header.
3. Confirm it opens `/admin/billing/activate` as a full page.
4. Confirm the layout closely matches `/start-your-store` but with billing activation wording.
5. Confirm there is no “FREE trial”, “7-day trial”, “no payment today” or “no credit card” copy on the activation page.
6. Confirm pricing cards use the same mobile carousel sizing as `/start-your-store`.
7. Select currency and monthly/yearly billing.
8. Click a plan button and confirm Stripe Checkout opens in a new window/tab.
9. On mobile, tap the expired trial billing header button.
10. Confirm the billing activation journey opens in a popup.
11. Swipe the pricing carousel in the popup and confirm it uses the same sizing as `/start-your-store`.
12. Confirm active tenants still open the normal billing management popup.
13. Confirm non-expired trial tenants still open the normal trial details popup.

## SQL
No Supabase SQL required.
