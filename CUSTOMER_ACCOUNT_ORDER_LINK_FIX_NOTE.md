# Ver-0.116C

This patch forces signed-in customer account id through checkout and into order persistence.

## What changed
- Checkout now resolves `customerAccountId` once inside `handleSubmit` and sends it explicitly.
- `/api/orders` now explicitly accepts `customerAccountId`, resolves the account, and persists `customer_account_id`.
- The order create response now echoes the resolved `customerAccountId` to help verify the linkage path.

## Expected result
New signed-in orders should save with a non-null `orders.customer_account_id`.
