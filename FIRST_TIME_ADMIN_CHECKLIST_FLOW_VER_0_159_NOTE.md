# Orduva Ver-0.159 — first-time admin checklist action flow polish

This build returns to the main first-time store-owner setup journey after the logo/settings polish fixes.

## What changed

- Polished the interactive launch checklist wording so it feels calmer for first-time store owners.
- Added a clear progress message that changes as the store gets closer to launch.
- Added helper text per checklist item explaining whether the item auto-ticks or should be manually ticked.
- Improved checklist actions so setup-tool tasks open the hidden setup tools smoothly when already on the admin home page.
- Improved the Settings checklist action so it opens the relevant Branding and wording section.
- Made branding/contact setup auto-detect more useful by checking for visual identity, contact method and currency basics.
- Added `favicon_url` to the checklist diagnostics so logo/favicon setup can count as visual identity.

## Not touched

- Public onboarding flow
- Dedicated onboarding success page
- Email sending logic
- Owner platform access gate
- Owner recent signups/readiness panels
- Wildcard routing
- Storefront product card UI
- Logo/favicon upload storage
- Payment/free-trial logic
- Supabase schema

## Supabase

No new SQL is required. This build reuses the existing `tenant_launch_checklists` table from Ver-0.156.
