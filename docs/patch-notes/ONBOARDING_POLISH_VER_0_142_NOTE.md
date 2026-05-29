# Orduva Ver-0.142 — Onboarding polish and tenant launch checklist

This patch improves the platform/client onboarding flow after the Ver-0.141B wildcard routing checkpoint.

## Touched

- `components/admin/TenantOnboardingManager.tsx`
- `app/api/platform/tenants/route.ts`
- `app/api/admin/tenants/route.ts`
- `lib/version.ts`

## What changed

- Bumped app display version to `Ver: 0.142`.
- Added clearer client-side onboarding validation before creating a tenant.
- Added warning panels for missing business name, short slug, reserved slugs, duplicate recent slugs, invalid emails and incomplete owner login details.
- Added reserved-slug guidance directly under the storefront slug preview.
- Improved the success panel after tenant creation with direct launch links for:
  - generated storefront URL
  - shared admin URL at `https://admin.orduva.com/admin`
- Expanded the launch checklist into a practical tenant go-live sequence.
- Made recent tenant subdomain entries clickable.
- Tightened API validation for contact email and owner email.
- Added `platform` to the admin tenant API reserved slug list to match platform onboarding protection.

## Not touched

- Wildcard tenant routing.
- Netlify domain/wildcard configuration.
- Storefront product card UI.
- Push notification logic.
- Customer accounts/order linkage.
- Advanced theme editor logic.

## Supabase SQL

No Supabase SQL required for this patch.
