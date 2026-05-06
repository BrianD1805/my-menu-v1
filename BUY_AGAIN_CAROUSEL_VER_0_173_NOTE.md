# Orduva Ver-0.173 — Buy Again carousel

## Summary

Adds a signed-in customer **Buy Again** button beside the existing favourites button in the welcome panel.

## Behaviour

- Products/menu continue to load first.
- Customer login state is checked after storefront paint.
- Favourite IDs and Buy Again product IDs load quietly in the background.
- Favourites remain hidden by default and can be shown/hidden from the welcome panel.
- Buy Again remains hidden by default and can be shown/hidden from the welcome panel.
- Buy Again carousel shows products the signed-in customer has bought before.
- Buy Again cards reuse the favourites carousel styling.
- Product hearts still show favourited state.
- The extra blue focus outline/ring has been removed from both welcome-panel buttons.

## Files touched

- `components/menu/MenuBrowser.tsx`
- `app/api/customer/buy-again/route.ts`
- `public/sw.js`
- `lib/version.ts`

## Supabase

No Supabase SQL required. Uses existing `orders` and `order_items` data linked to `customer_account_id`.
