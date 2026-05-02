# Orduva Ver-0.146 — Public landing page onboarding links and controlled client signup entry

## Summary

This build adds clear public landing page entry points for prospective clients to start the Orduva onboarding journey, while keeping the actual store creation flow controlled behind the Orduva platform access key.

## Intent

Clients can now find onboarding from the main Orduva landing page without being given a hidden URL. However, the onboarding form still requires the platform access key before any store records can be created or reviewed.

## Changed

- Public landing page header CTA now says `Start your store`.
- Main hero CTA now says `Create your Orduva store`.
- Added a controlled onboarding explainer card to the landing page.
- Added a lower landing page CTA section for new client setup.
- Added an `Already have a store? Go to admin` path for existing store owners.
- Updated platform onboarding page wording to `Controlled client onboarding`.
- Updated onboarding access panel wording to explain that public links are available but store creation remains protected.
- Bumped live version to Ver: 0.146.

## Not changed

- No wildcard/domain routing changes.
- No Supabase schema changes.
- No storefront product card changes.
- No push notification changes.
- No customer account/order linkage changes.
- No removal of the platform access key requirement.

## Test focus

- `https://www.orduva.com` should show clear onboarding CTAs.
- All public onboarding CTAs should lead to `/platform/onboarding`.
- `/platform/onboarding` should still require the platform access key before creating or reviewing stores.
- Admin login links should still point to `https://admin.orduva.com/admin`.
