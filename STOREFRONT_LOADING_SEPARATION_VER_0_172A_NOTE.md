# Orduva Ver-0.172A — separate splash loading from favourites welcome status

## Purpose

This is a same-thread polish patch after Ver-0.172.

The previous patch mixed two separate UX ideas:

1. The storefront/PWA loading screen.
2. The favourites loading/status note.

## Change

- The splash/loading screen now only shows a clean premium loading animation and the message: `We're getting things ready.`
- The splash/loading screen no longer uses a heart icon.
- Favourites status remains handled inside the welcome panel only.
- The large favourites strip remains disabled from automatic loading/rendering.
- Favourite IDs still load quietly after customer auth so product cards can show already-favourited hearts.

## Files touched

- `app/loading.tsx`
- `components/menu/StorefrontClientLoader.tsx`
- `components/menu/StorefrontPwaRegistrar.tsx`
- `public/sw.js`
- `lib/version.ts`

## Supabase

No Supabase SQL required.
