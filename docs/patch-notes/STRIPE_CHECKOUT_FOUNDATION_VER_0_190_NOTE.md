# Orduva Ver-0.190 — Stripe checkout foundation

Adds Stripe hosted checkout foundation for Starter, Growth and Pro across five currencies and monthly/yearly billing intervals.

## Added

- `/api/billing/stripe/checkout` tenant-admin protected API route.
- `lib/stripe-checkout.ts` direct Stripe Checkout Session helper.
- `components/admin/StripeUpgradeButton.tsx` for admin/trial upgrade prompt.
- `/billing/success` and `/billing/cancel` pages.
- 30 Stripe Price ID env variable placeholders in `.env.example`.
- Stripe metadata includes tenant id, slug, plan, currency and billing interval.

## Notes

- No Stripe package dependency was added. The API uses Stripe's HTTP API directly so `npm install` is not required for a new dependency.
- No webhook automation is included in this patch. Webhooks should come next.
- No Supabase schema changes are required. Existing billing fields on `tenants` are used where possible.
