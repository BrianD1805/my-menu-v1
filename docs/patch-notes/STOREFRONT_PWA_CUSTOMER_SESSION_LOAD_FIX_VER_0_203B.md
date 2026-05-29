# Orduva Ver-0.203B — Storefront PWA customer session load fix

## Purpose
Fixes an installed PWA storefront startup issue where the customer account state, favourites, and Buy Again panels sometimes did not appear until the user performed a hard refresh / swipe-down refresh.

## What changed
- Bumped visible version to Ver: 0.203B.
- Bumped storefront service worker cache strings to ver-0-203b.
- Changed storefront navigation caching from immediate cached-shell return to short network-first navigation.
- Kept cached fallback for slow/offline startup, but gives the live page a chance first.
- Improved customer session loading on the storefront:
  - adds cache-busting auth check requests
  - includes credentials explicitly
  - retries once with a longer timeout
  - refreshes customer state on focus, pageshow and visibility change
- Improved the customer account header with the same retry/focus refresh behaviour.

## Expected result
When opening the installed storefront PWA, signed-in customer state should hydrate automatically without needing a manual hard refresh. Favourites and Buy Again should load after the customer session is confirmed.

## Supabase SQL
No Supabase SQL required.

## Test checklist
1. Deploy Ver-0.203B.
2. Open the storefront in an installed PWA where a customer is already signed in.
3. Confirm the customer/account header appears without a swipe-down refresh.
4. Confirm the welcome customer name appears where applicable.
5. Confirm Favourites can be opened and load.
6. Confirm Buy Again can be opened and load.
7. Fully close and reopen the PWA, then repeat the checks.
8. Confirm normal storefront products and cart still load.
