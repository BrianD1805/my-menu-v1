# Orduva Ver-0.208B — Tenant Admin Affiliate Share Display Fix

## Purpose
Fixes the tenant admin referrals dashboard so affiliate-led stores introduced through a tenant are displayed under affiliate introductions at the tenant introduction share rate, normally 5%, instead of appearing in the tenant referred stores list at the affiliate/customer reward rate.

## Changed files
- app/api/admin/referrals/route.ts
- components/admin/TenantReferralDashboardPanel.tsx
- lib/version.ts
- public/sw.js

## Behaviour
- Tenant referral signups remain in Tenant referral activity and show the normal tenant referral rate, normally 15%.
- Affiliate-led signups such as a store created from an approved affiliate link are moved to Affiliate introductions and show the tenant introduction share, normally 5%.
- The approved affiliate still earns their own affiliate commission separately, normally 10%.

## Supabase SQL
No Supabase SQL required for Ver-0.208B.
