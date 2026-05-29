# Orduva Ver-0.179 — Split platform dashboard and onboarding pages

## Summary

- Added `/platform` as the main owner dashboard page.
- Kept `/platform/onboarding` as a dedicated onboarding/tools page.
- Both pages are wrapped in `OwnerPlatformAccessGate`, so each platform page requires the owner platform key before content is shown.
- Added shared owner navigation links for Dashboard and Onboarding in the unlocked platform bar.
- Moved the clickable dashboard summary/store readiness panel to `/platform`.
- Removed the dashboard summary panel from `/platform/onboarding` to make onboarding less overwhelming.

## Supabase

No Supabase SQL required.
