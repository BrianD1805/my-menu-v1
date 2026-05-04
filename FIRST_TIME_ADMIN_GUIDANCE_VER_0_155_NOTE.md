# Orduva Ver-0.155 — first-time admin guidance and simplified onboarding success

## Purpose

This patch reduces information overload for newly onboarded store owners.

## Changes

- Simplified `/start-your-store/success` so it only shows essential confirmation details and one clear action: continue to admin setup.
- Removed the extra storefront link, long checklist and side guidance from the public success page.
- Added a reusable admin launch checklist component.
- Added the checklist to the top of `/admin/login` so a new store owner sees the setup journey before entering admin.
- Added the same checklist to the top of `/admin` so the store owner can tick items off while configuring the store.
- Moved phone install and push notification tools into the checklist as optional setup tools rather than separate top-level warnings/cards.
- Removed the first-time admin shock of showing Admin install, push health warning and live push setup as separate items before the user understands the admin area.

## Scope deliberately not changed

- Public onboarding API
- Email sending logic
- Owner platform access gate
- Owner recent signups/readiness panels
- Wildcard tenant routing
- Storefront product cards
- Push notification backend
- Supabase schema
