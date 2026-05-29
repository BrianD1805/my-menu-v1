# Ver-0.116H

This patch writes `customer_account_id` into the real orders insert directly.

## What changed
- The real insert object in `app/api/orders/route.ts` now writes:
  `customer_account_id: body.customerAccountId?.trim() || null`
- This avoids losing the signed-in customer account id through intermediate logic.

## Expected result
A new signed-in order should now save with a non-null `orders.customer_account_id`.
