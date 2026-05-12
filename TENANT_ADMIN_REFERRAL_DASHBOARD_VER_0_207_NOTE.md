# Orduva Ver-0.207 — Tenant Admin Referral Dashboard

## Scope
Adds a tenant-facing referral dashboard inside Tenant Admin at `/admin/referrals`.

## What changed
- Added a new Tenant Admin Referrals page.
- Added a tenant referral dashboard client panel.
- Added a tenant-scoped admin referrals API endpoint.
- Added Referrals to the Tenant Admin desktop and mobile navigation.
- Shows the tenant referral link for referring other businesses.
- Shows the affiliate application/introduction link for people applying to become approved public Orduva affiliates through that tenant.
- Separates tenant referral rewards from affiliate introduction rewards.
- Shows tenant referral signups, affiliate applicants, approved affiliate partners, pending/paid credits and estimated monthly reward totals by currency.

## Safety notes
- No owner/platform sign-in changes.
- No tenant admin login changes.
- No storefront checkout changes.
- No Stripe/payment/settings changes.
- No product card changes.

## Supabase
No new Supabase SQL is required for Ver-0.207. This patch uses the referral and affiliate tables/columns already introduced in Ver-0.184, Ver-0.185, Ver-0.206 and Ver-0.206A.
