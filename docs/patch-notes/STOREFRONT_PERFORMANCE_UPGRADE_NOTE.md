# Orduva Ver-0.120 — Storefront Loading Performance Upgrade

This patch focuses on storefront load speed and clearer loading UX before continuing with subdomain/onboarding work.

## Included

- Bumped visible version to `Ver: 0.120`.
- Added a generic app-level loading screen using `Getting things ready…` instead of product-specific wording.
- Changed storefront server loading so tenant settings, categories, and products load in parallel after tenant resolution.
- Reduced storefront product query payload by selecting only the fields needed by the menu.
- Added server-side timing logs for storefront tenant resolution, tenant lookup, and menu/settings loading.
- Added server-side timing logs to `/api/products`.
- Added client-side timing logs for account header check, checkout customer profile prefill, checkout products/settings, account profile, and account orders.
- Added timeout protection to non-critical customer account checks in storefront header and checkout prefill.
- Changed `/account` so the customer profile loads first and order history loads afterwards instead of blocking the whole account page.

## Not touched

- Product card UI.
- Order saving.
- `customer_account_id` persistence.
- Admin push logic.
- Customer status push logic.
- Subdomain routing.
- Client onboarding.
