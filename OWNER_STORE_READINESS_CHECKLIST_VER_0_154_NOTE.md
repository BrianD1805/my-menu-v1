# Orduva Ver-0.154 — owner store readiness checklist with visual status badges

This patch adds an owner-only store readiness dashboard inside the protected Orduva platform area.

## Summary

- Adds `/api/platform/store-readiness` protected by the existing Orduva platform access key.
- Adds `OwnerStoreReadinessPanel` to `/platform/onboarding` after the email settings panel.
- Shows visual readiness badges per store: Ready, Nearly ready, or Needs setup.
- Shows a readiness score, key issue count, and full expandable checklist for each onboarded store.
- Includes checks for foundation, owner login, currency, menu/products, branding, product photos, contact details, admin push, test orders, and onboarding email events.

## Security

The readiness panel and API are owner-only. They require the existing owner platform access gate and platform access key.

## No database changes

No Supabase SQL is required. The panel reads existing Orduva tables only.
