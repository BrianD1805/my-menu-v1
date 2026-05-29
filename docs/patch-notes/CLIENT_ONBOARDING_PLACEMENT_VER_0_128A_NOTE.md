# Orduva Ver-0.128A — Client Onboarding Placement Correction

This patch corrects the Ver-0.128 onboarding placement.

## What changed

- Client onboarding is now under the Orduva platform/root area:
  - `/platform/onboarding`
- The normal tenant admin no longer shows onboarding in its navigation.
- The normal tenant admin dashboard no longer shows a client onboarding card.
- `/admin/onboarding` redirects back to `/admin` so onboarding is not mixed into tenant admin tools.
- The platform landing page now links to platform onboarding.
- A platform access key prompt was added to the onboarding screen.
- A new platform API route was added:
  - `/api/platform/tenants`

## Access key

The platform onboarding API uses:

- `ORDUVA_PLATFORM_ACCESS_KEY`, if set
- otherwise falls back to `ADMIN_ACCESS_KEY`

## What was not touched

- Tenant storefront routing
- ZimZa storefront
- Tenant admin product/order/settings logic
- Product cards
- Add-to-cart animation
- Checkout/order saving
- Customer accounts
- Push notifications
