# Orduva Ver-0.158 — admin settings soft grey background and favicon identity fix

## Summary

This build polishes the tenant admin settings experience and corrects the Active store identity icon.

## Changes

- Updated the live version to `Ver: 0.158`.
- Added a soft grey background variant for the admin settings page.
- Applied the soft grey background only to `/admin/settings`.
- Updated the Active store identity badge to use the tenant favicon instead of the full tenant logo.
- Passed tenant favicon data into the shared admin shell across the main admin pages.
- Kept the full tenant logo for storefront branding and larger preview areas.

## Not changed

- Logo/favicon upload logic.
- Supabase Storage setup.
- Storefront product card UI.
- Mobile storefront header polish.
- Public onboarding.
- Owner platform tools.
- Push notification logic.
- Payment/free-trial logic.
- Supabase schema.

## Testing

After deployment:

1. Open `/admin/settings`.
2. Confirm the settings page background is soft grey, not the previous cream tint.
3. Confirm the Active store card uses the tenant favicon/icon.
4. Confirm the full uploaded logo is not squeezed into the small Active store icon.
5. Confirm other admin pages still render normally.
