# Orduva Ver-0.198 — Owner dashboard billing filters/export polish

Build focus: improve the owner dashboard billing overview so billing and payment records are easier to search, filter and export.

## Changes

- Bumped visible version to `Ver: 0.198`.
- Bumped service worker/storefront cache strings to `ver-0-198`.
- Added tenant billing search to the Owner Billing overview panel.
- Tenant billing search covers store name, slug, plan, status, provider, Stripe references and latest payment reference.
- Added CSV export for the currently filtered tenant billing records.
- Added Stripe payment search in the payment panel.
- Added payment status filter for Stripe payment records.
- Added CSV export for the currently filtered Stripe payment records.
- Expanded `/api/platform/billing-overview` to return `paymentRecords` for export/search while keeping the existing `recentPayments` list for backward compatibility.
- Updated owner billing wording to describe the view as searchable/exportable.

## Export behaviour

The CSV exports are generated client-side from the data already loaded by the owner billing overview API.

- `Export tenants CSV` exports the tenant rows currently matching the selected status card and search term.
- `Export payments CSV` exports the payment rows currently matching the payment search and payment status filter.

## Files changed

- `components/admin/OwnerBillingOverviewPanel.tsx`
- `app/api/platform/billing-overview/route.ts`
- `lib/version.ts`
- `public/sw.js`
- `components/menu/StorefrontClientLoader.tsx`

## Testing checklist

1. Open `/platform`.
2. Confirm the Billing overview panel still loads.
3. Use the tenant status cards and confirm counts/filtering still work.
4. Search by store name, slug, plan or Stripe reference.
5. Export tenant CSV and confirm the file downloads.
6. Search Stripe payment records.
7. Filter by payment status.
8. Export payment CSV and confirm the file downloads.
9. Confirm Store overview below the billing panel still works.

No Supabase SQL is required.
