# Orduva Patch Ver-0.222E — Storefront hydration cache fix

This patch fixes a local/dev hydration warning caused by restoring cached storefront data from localStorage during the first client render.

## What changed

- StorefrontClientLoader now starts with the same empty loading state on both server and first client render.
- Cached storefront data is restored after hydration inside useEffect.
- Storefront cache key was bumped to `ver-0-222e` so older cached payloads cannot be used during this patch test.
- Visible app version bumped to Ver: 0.222E.

## SQL

No Supabase SQL required.

## Safety

No payment provider logic changed.
No product card UI changed.
No receipt PDF layout logic changed from Ver-0.222D.
