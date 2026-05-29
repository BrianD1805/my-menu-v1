# Orduva Ver-0.120A — Restrict Generic Loading Message

## Purpose
This patch narrows the Ver-0.120 generic loading behaviour so the large loading panel does not appear during ordinary storefront page/section navigation.

## Changes
- Bumped visible app version to `Ver: 0.120A`.
- Changed the root `app/loading.tsx` fallback to return `null`, preventing the large generic loading panel from flashing between normal page/route selections.
- Kept customer-data-specific loading feedback where it is useful:
  - `/account` now shows a focused customer account loading panel while profile details are opening.
  - Checkout now shows a small inline `Checking saved customer details…` card while saved profile/prefill data is being checked.
  - Order history still shows its local loading message when recent customer orders are fetched.
- Kept the Ver-0.120 performance timing logs.

## Not touched
- Product card UI.
- Order saving / `customer_account_id` persistence.
- Admin push logic.
- Customer status push logic.
- Subdomain routing.
- Onboarding.
