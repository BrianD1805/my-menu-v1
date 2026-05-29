# Ver-0.116A

This patch fixes signed-in checkout order linkage.

## Intent
When a signed-in customer places an order:
- checkout sends `customerAccountId`
- `/api/orders` persists it to `orders.customer_account_id`

## Expected result
New signed-in orders should now appear in `/account` order history.
