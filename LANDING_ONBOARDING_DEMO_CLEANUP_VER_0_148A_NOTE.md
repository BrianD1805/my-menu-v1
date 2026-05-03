# Orduva Ver-0.148A — landing onboarding page and ZimZa demo slug cleanup

## Summary

This same-thread patch cleans up the public landing page and client onboarding journey after Ver-0.148.

## Changes

- Public landing page CTAs now open `/start-your-store` instead of jumping to an embedded onboarding section.
- Removed the embedded public onboarding form from the home page.
- Added a dedicated client onboarding page at `/start-your-store`.
- Moved the black "New client setup" CTA block so it is the last section before the footer on the public landing page.
- Updated public demo wording so ZimZa Express is the working example/demo storefront.
- Changed app defaults so the demo storefront slug is `zimzaexpress` rather than the legacy `orduva` tenant slug.
- Added a Supabase migration to rename the existing ZimZa Express tenant slug from `orduva` to `zimzaexpress`.

## Not touched

- Wildcard routing structure.
- Storefront product card UI.
- Push notification logic.
- Customer accounts/order linkage.
- Payment/free-trial logic.
- Owner platform access key protection.
