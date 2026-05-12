# Orduva Ver-0.206 — Affiliate Application and Approved Affiliate Foundation

This patch adds the first approved public affiliate workflow. It is separate from the existing tenant referral programme.

## Added

- Storefront footer now includes a text link inside the Orduva tenant referral section: **Apply to become an Orduva affiliate**.
- New public application page: `/affiliate/apply`.
- New approved affiliate login: `/affiliate/login`.
- New approved affiliate dashboard: `/affiliate/dashboard`.
- New affiliate PWA manifest under `/affiliate/manifest.webmanifest` so the approved affiliate dashboard can be installed separately from storefront, tenant admin and owner platform.
- New owner platform section: `/platform/affiliates`.
- Owner can review applications, approve/decline applicants, generate a share link and see the affiliate login key.
- Approved affiliate share links use:
  - `https://www.orduva.com/?aff=<tracking-code>&ref=<tracking-code>&ref_source=affiliate_partner`
- Public onboarding now preserves affiliate referral parameters and connects new store signups to approved affiliate links.

## Commission model foundation

- Approved affiliate commission: 10% monthly on paid Orduva subscription sales.
- Referring tenant commission: 5% monthly when the approved affiliate came via a tenant storefront affiliate application link.
- Affiliate rewards are stored separately from tenant referral sources using `referrer_type = public_affiliate` and `affiliate_id`.
- Tenant referral links still use the existing tenant referral pathway.

## Supabase

Supabase SQL is required before deploying this patch:

- `SUPABASE_VER_0_206_AFFILIATE_APPLICATIONS_FOUNDATION.sql`
- `supabase/migrations/2026-05-12_ver_0_206_affiliate_applications_foundation.sql`

Run the SQL before deployment because the code reads/writes the new affiliate tables and new referral reward columns.

## Notes

This is the foundation for the affiliate workflow. The platform can accept applications, approve partners, generate links, capture affiliate-attributed signups and show an affiliate dashboard. Stripe/Yoco/Pesapal paid subscription webhook automation can use the same referral reward fields when the payment event flow is expanded further.
