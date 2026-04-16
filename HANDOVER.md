# Orduva Ver-0.045 Handover

This is a small rescue patch built from Ver-0.044.

## Fix included
- Fixes the Netlify TypeScript build failure:
  - `components/menu/ProductCard.tsx`
  - `lib/cart.ts`
- `StoredCartItem` is now exported from `lib/cart.ts`
- ProductCard cart writes now use the same cart shape as checkout/cart button:
  - `productId`
  - `quantity`

## Reason
Netlify failed on Ver-0.044 with:
- `Module "@/lib/cart" has no exported member 'StoredCartItem'`

There was also a cart-shape mismatch in ProductCard using `id/qty` instead of `productId/quantity`.

## Version
- In-app version updated to `Ver: 0.045`

## Deploy
```bash
git add .
git commit -m "Orduva Ver-0.045 fix Netlify cart type build error"
git push origin main
```
