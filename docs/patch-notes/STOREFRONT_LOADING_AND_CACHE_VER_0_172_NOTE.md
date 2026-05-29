# Orduva Ver-0.172 — storefront loading and cache speed pass

## Goal

Reduce the mobile PWA splash/loading frustration and make the storefront feel more intentional while data is being prepared.

## Changes

- Added a premium lightweight loading state with the message: "We're getting things ready."
- Added a tasteful outlined-heart loading icon and subtle animation.
- Added localStorage storefront payload caching per tenant so repeat opens can paint from recent cached products/categories/settings immediately while fresh data refreshes in the background.
- Added real storefront service worker caching:
  - static assets: cache-first
  - `/api/products`: stale-while-revalidate
  - storefront navigation: network-first with cached fallback
- Updated `/api/products` response headers to allow short edge caching and stale-while-revalidate.
- Registered the storefront service worker earlier so the improved cache layer is available for future PWA opens sooner.
- Stopped automatically rendering the large favourites strip after the welcome panel.
- Customer auth still loads after the products/menu are visible.
- Favourite IDs still load quietly in the background for signed-in customers so product hearts can still show saved state.
- Added a small welcome-screen note while favourites are being marked in the background.

## Important note

The native mobile PWA splash screen is controlled by the browser/OS before the React app is ready to paint. App code cannot directly place custom text inside that native splash. This patch reduces the work before first useful paint and adds a branded in-app loading state immediately after the browser hands control to the app.

## Supabase

No Supabase SQL required.
