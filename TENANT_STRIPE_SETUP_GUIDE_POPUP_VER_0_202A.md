# Orduva Ver-0.202A — Tenant Stripe setup guide popup

This patch adds a non-technical help popup inside Tenant Admin → Store settings → Storefront payment options.

## What changed

- Bumped visible version to Ver: 0.202A.
- Added a **Help me find these keys** button beside the Stripe customer payment setup area.
- Added a mobile/desktop modal explaining where the tenant can find:
  - Stripe publishable key (`pk_test_...` / `pk_live_...`)
  - Stripe secret key (`sk_test_...` / `sk_live_...`)
  - Stripe webhook signing secret (`whsec_...`)
- Added plain-English warnings that these must be the tenant's own Stripe keys, not the Orduva owner billing keys.
- Added a note that the exact tenant storefront Stripe webhook endpoint will be confirmed by the later Stripe storefront checkout build.
- No Supabase SQL required.

## Test

1. Open tenant admin.
2. Go to Store settings.
3. Scroll to Storefront payment options.
4. Click **Help me find these keys**.
5. Confirm the guide opens neatly on desktop and mobile.
6. Confirm the close button and backdrop close the popup.
7. Confirm cash/COD settings and Stripe credential saving still work as before.
