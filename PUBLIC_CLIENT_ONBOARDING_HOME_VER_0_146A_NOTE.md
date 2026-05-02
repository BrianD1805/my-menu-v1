# Orduva Ver-0.146A — public client onboarding lives on the home page

Same-thread correction to Ver-0.146.

## Purpose

Potential clients should not be sent to `/platform/onboarding` to start onboarding. The platform area is for the Orduva owner only.

## Changes

- Public landing page CTAs now point to `#client-onboarding` on `https://www.orduva.com/`.
- Added a public home-page onboarding section using the controlled onboarding form.
- The client onboarding section still requires the controlled onboarding code/access key before submission.
- Client-facing wording says `Onboarding access code`, not `Platform access key`.
- Client-facing onboarding hides the owner multi-store dashboard and owner store switcher.
- `/platform/onboarding` wording now clearly identifies it as the owner platform onboarding area.
- Version bumped to `Ver: 0.146A`.

## Safety

- No Supabase schema changes.
- No wildcard routing changes.
- No storefront/product card changes.
- No push notification changes.
- Owner platform route remains available for owner-only multi-store overview and store switching.
