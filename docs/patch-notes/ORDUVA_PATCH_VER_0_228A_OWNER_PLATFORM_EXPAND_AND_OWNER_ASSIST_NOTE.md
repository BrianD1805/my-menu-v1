# Orduva Patch Ver-0.228A — Owner platform list expansion and owner assist access

## Summary
Refines the Owner Platform client list so each row stays compact until opened, replaces the old Open store button with icon-style actions, and adds owner-support access to tenant admin through the existing Owner Platform security gate.

## Changes
- Owner Platform list rows now expand/collapse on click.
- Removed the large Open store button from the list row.
- Added a compact icon-style row opener.
- Expanded details now focus on owner-relevant account/billing information only.
- Checklist details are no longer shown in the client list expansion.
- Added an owner-only support access route to open a tenant admin session without the tenant password.
- Owner assist access is protected by the existing Owner Platform key and 2FA session where enabled.
- Added an Open admin as owner action in expanded client details.

## Security note
This is not a tenant master password. It creates a short admin session for the selected tenant only after the Orduva Owner Platform has already been unlocked. It does not expose the tenant password.

## SQL
No Supabase SQL required.

## Files touched
- components/admin/OwnerBillingOverviewPanel.tsx
- app/api/platform/tenant-admin-session/route.ts
- lib/version.ts
- docs/ORDUVA_PATCH_LOG.md
- docs/patch-notes/ORDUVA_PATCH_VER_0_228A_OWNER_PLATFORM_EXPAND_AND_OWNER_ASSIST_NOTE.md
