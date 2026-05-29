# Orduva Ver-0.169I — hide favourites area for logged-out customers

## Summary

This patch prevents the storefront favourites reserved/loading area from rendering for logged-out customers.

## Change

- Added a small `customerAuthStatus` state in `components/menu/MenuBrowser.tsx`.
- The existing `/api/customer/auth/me` check now determines whether the customer is signed in before favourites are loaded.
- If the customer is logged out, favourites state is cleared and the favourites section renders nothing.
- The favourites API is only called after a signed-in customer is confirmed.
- The reserved/loading favourites strip remains available for signed-in customers only.

## Files changed

- `components/menu/MenuBrowser.tsx`
- `lib/version.ts`

## Supabase

No Supabase SQL required.
