# Orduva Ver-0.150A — Move Email Settings Test Panel to Owner Platform Only

## Purpose

This patch corrects Ver-0.150 so the email settings and test panel is treated as a global Orduva owner/platform tool, not a tenant store setting.

## Changes

- Bumped version to Ver: 0.150A.
- Removed the Email settings and test panel from tenant Admin > Settings.
- Added the platform email settings/test panel to the owner-only platform area at `/platform/onboarding`.
- Added a protected owner-platform API route at `/api/platform/email-settings/test`.
- The platform email test route requires the Orduva platform access key.
- The tenant settings wording is now store-scoped only and no longer references the global owner email panel.
- Public onboarding email sending remains unchanged.
- The existing tenant-admin email test API remains in the code but is no longer surfaced in tenant settings.

## Safety notes

- No Supabase schema changes are required.
- No payment/free-trial logic was added.
- Wildcard routing, public client onboarding, push notifications and storefront product cards were not changed.
