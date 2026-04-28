# Orduva Ver-0.128 — Client Onboarding / Tenant Creation Foundation

This build adds the first admin-side foundation for creating new client tenants.

## Added
- Admin onboarding page at `/admin/onboarding`
- Admin nav item: `Onboard`
- API route: `/api/admin/tenants`
- Create tenant record with slug/status
- Create tenant settings with default branding and country/currency defaults
- Create a starter `Menu` category
- Optional owner login creation
- Recent tenants list
- Storefront URL preview: `slug.orduva.com`

## Not changed
- Storefront product cards
- Add-to-cart animation
- Checkout/order persistence
- Customer account flow
- Push notifications
- Existing tenant routing

## Notes
This is foundation only. Later onboarding builds should add richer launch checklist tracking, logo upload during onboarding, product import/templates, and client invitation/email flows.
