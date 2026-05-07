# Orduva Ver-0.174 — early static storefront preloader

## Purpose

Improve the perceived mobile PWA startup by showing the Orduva loading message earlier, before the React storefront loader has mounted.

## What changed

- Added `components/menu/EarlyStorefrontPreloader.tsx`.
- Rendered the early static preloader directly in `app/page.tsx` for tenant storefront startup only.
- The preloader is plain HTML/CSS/script, so it can paint as soon as the first page HTML arrives.
- `StorefrontClientLoader` now hides the early preloader once cached/live storefront payload is ready, or if an error state must be shown.
- Storefront metadata generation no longer fetches tenant/settings from Supabase. This removes a blocking server-side query before first HTML, which was one of the reasons the native mobile PWA splash stayed visible too long.
- Service worker/cache version bumped to `ver-0-174`.
- Live version bumped to `Ver: 0.174`.

## Load order after this patch

1. Native PWA splash appears while Android/Chrome waits for first HTML.
2. First HTML returns faster because metadata no longer waits for tenant/settings Supabase calls.
3. Static Orduva preloader paints immediately: “We're getting things ready.”
4. Client storefront loader uses cached menu payload when available.
5. Fresh products/settings/categories refresh via `/api/products`.
6. Customer login check runs after storefront paint.
7. Favourites and Buy Again IDs load quietly in the background.

## Supabase SQL

No Supabase SQL required.
