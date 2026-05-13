# Orduva Ver-0.213A — Yoco Return Link + Cart Clear Fix

This patch fixes the Yoco post-payment return experience.

## Fixes

- Yoco success page now builds Back to store and Back to checkout links from the original tenant slug instead of using `/`, which could send customers to the Netlify landing host.
- Yoco success page now clears the correct tenant cart after payment is confirmed.
- Yoco cancel/failure pages now also use tenant-specific storefront and checkout links.
- Payment/admin order logic is unchanged.

## Supabase SQL

No Supabase SQL required for Ver-0.213A.

- New Yoco checkouts now use the canonical tenant storefront host for Yoco return URLs, so Yoco returns customers to `tenant.orduva.com` instead of the Netlify production host.
