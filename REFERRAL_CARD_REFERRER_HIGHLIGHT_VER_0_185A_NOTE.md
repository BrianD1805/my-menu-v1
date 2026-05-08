# Orduva Ver-0.185A — Highlight referring tenant on referral cards

## Summary

Updated the platform referral rewards card layout so the referring tenant is the main highlighted card title.

## Behaviour

- Referral cards now lead with the tenant earning the reward.
- The referred store is shown beneath as `Referred store: <name>`.
- Status, monthly reward percentage, referral code, source, captured date, payment tools, and credit ledger remain unchanged.
- No Supabase SQL required.

## Files touched

- `components/admin/OwnerReferralRewardsPanel.tsx`
- `lib/version.ts`
- `public/sw.js`
- `components/menu/StorefrontClientLoader.tsx`
