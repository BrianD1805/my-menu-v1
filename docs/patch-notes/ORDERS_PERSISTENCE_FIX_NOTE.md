# Ver-0.116K

This patch directly writes `customer_account_id` into the actual `orders` insert block in:

`app/api/orders/route.ts`

Expected result:
- new signed-in orders save with a non-null `customer_account_id`
- customer order history can then show those orders
