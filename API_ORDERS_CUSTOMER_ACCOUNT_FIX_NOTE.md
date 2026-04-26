# Ver-0.116F

This patch hard-fixes `/api/orders` to persist `customer_account_id` from the confirmed checkout request payload.

## What changed
- `/api/orders` now validates `body.customerAccountId` directly against `customer_accounts.id`
- the order insert writes `customer_account_id: persistedCustomerAccountId`
- the create-order response echoes the saved `customerAccountId` for confirmation

## Expected result
When checkout sends:
- tenantId
- tenantSlug
- customerAccountId

the saved order row should now contain a non-null `orders.customer_account_id`.
