# Orduva Ver-0.199 — Owner dashboard polish and alert flags

## Purpose

Ver-0.199 polishes the owner billing dashboard so the owner can quickly see which tenant billing records need attention, not just view raw billing/payment rows.

## Changes

- Bumped visible version to `Ver: 0.199`.
- Bumped service worker/storefront cache strings to `ver-0-199`.
- Added owner dashboard alert flags inside the `/platform` Billing overview panel.
- Added a new `Alert flags` summary card in the billing header.
- Added a new `Alert flags` filter card in the tenant billing filter row.
- Added per-tenant alert badges on tenant billing rows.
- Added alert flag export support to the tenant billing CSV.

## Alert flags currently shown

- Payment attention: local/Stripe status is past due, unpaid, incomplete or otherwise needs checking.
- Missing Stripe link: tenant is active but does not have both customer and subscription references.
- No Stripe payment record: tenant is active but Orduva cannot see a Stripe payment record.
- Old payment record: active tenant's latest Stripe payment record is more than 45 days old.
- Failed payment: latest payment record is a failed/unpaid style status.
- Trial ending soon: trial ends within 3 days.
- Trial ending this week: trial ends within 7 days.
- Trial date passed: tenant still appears trial but the trial end date has passed.
- Cancellation scheduled: supported if a local subscription status later records cancellation-at-period-end style values.

## Files changed

- `components/admin/OwnerBillingOverviewPanel.tsx`
- `lib/version.ts`
- `public/sw.js`
- `components/menu/StorefrontClientLoader.tsx`

## Testing

1. Open `https://admin.orduva.com/platform`.
2. Confirm Billing overview still loads.
3. Confirm the header shows the new Alert flags tile.
4. Click the Alert flags filter card and confirm only flagged tenants appear.
5. Confirm active, trial, attention, ended and missing Stripe filters still work.
6. Export tenant CSV and confirm the new Alert flags column appears.
7. Confirm payment search/filter/export still works.
8. Confirm the existing Store overview still works below the billing panel.

## Notes

This patch does not call Stripe live for every tenant. The alert flags are calculated from Orduva's local tenant and payment records so the owner dashboard stays fast and safe.

No Supabase SQL is required.
