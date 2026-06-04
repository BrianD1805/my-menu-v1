# ORDUVA PATCH VER-0.231A — Customer-entered amount checkout build fix

## Summary
Fixed the TypeScript build error in `app/checkout/page.tsx` where the local `CartItem` type did not include the new customer-entered amount fields.

## Changed
- Added `customAmount`, `customAmountReference`, `customAmountNote`, and `customAmountLabel` to the checkout cart item type.
- Bumped visible version to Ver: 0.231A.

## SQL
No Supabase SQL required.

## Notes
The Ver-0.231 SQL is still required before testing invoice/deposit/balance products.
