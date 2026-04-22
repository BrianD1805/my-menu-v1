# Ver-0.108 — reusable customer device push registration

## What changed
Customer push subscriptions can now be reused at device level by tenant + endpoint,
instead of requiring a fresh unique subscription record per order.

## Supabase step
Run this SQL in Supabase SQL Editor:

```sql
begin;

create unique index if not exists uq_customer_push_subscriptions_tenant_endpoint
  on public.customer_push_subscriptions (tenant_id, endpoint);

commit;
```

## Result
A customer can enable push once on the same device and that saved device can be reused for future orders.
