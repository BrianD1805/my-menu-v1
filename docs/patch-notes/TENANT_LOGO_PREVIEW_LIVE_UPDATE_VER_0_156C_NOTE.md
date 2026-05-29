# Orduva Ver-0.156C — logo preview sizing and live preview update

## Purpose

Same-thread polish fix after Ver-0.156A/B tenant asset upload work.

## Changes

- Bumped live version to Ver: 0.156C.
- Enlarged the logo preview in Tenant Settings so uploaded logos are shown as proper logo previews, not favicon-sized thumbnails.
- Kept favicon preview deliberately small and square.
- Updated logo/favicon form state immediately after successful upload.
- Switched the live section preview to Header after logo upload, so the user immediately sees the new logo in context.
- Passed logo_url and favicon_url into the live preview component.
- Added logo display to Global, Header and Welcome preview examples.
- Added a small favicon saved preview note in the Header preview.

## Not changed

- Supabase Storage upload route logic from Ver-0.156A/B.
- Database schema.
- Storefront product card UI.
- Public onboarding flow.
- Email sending logic.
- Owner platform logic.
