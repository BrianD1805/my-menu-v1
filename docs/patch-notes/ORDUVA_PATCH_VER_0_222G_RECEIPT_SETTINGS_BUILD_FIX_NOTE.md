# Orduva Patch Ver-0.222G — Receipt Settings Build Fix

This hotfix follows Ver-0.222F and addresses a local Next.js TypeScript build failure around the new receipt settings fields.

## Fixes
- Confirms the new receipt fields are part of the TenantSettingsForm FormState.
- Includes receipt settings changes in the unsaved-changes detection so the Save button state is correct.
- Bumps visible app version to Ver: 0.222G.

## SQL
No new Supabase SQL is required beyond the Ver-0.222F receipt information settings migration.

## Safety
- No payment provider logic changed.
- No checkout logic changed.
- No product card UI changed.
- No receipt PDF layout changes from Ver-0.222D were undone.
- No storefront hydration fix from Ver-0.222E was undone.
