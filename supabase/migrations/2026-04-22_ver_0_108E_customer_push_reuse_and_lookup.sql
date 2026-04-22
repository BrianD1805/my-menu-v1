begin;

delete from public.customer_push_subscriptions a
using public.customer_push_subscriptions b
where a.id < b.id
  and a.tenant_id = b.tenant_id
  and a.endpoint = b.endpoint;

drop index if exists uq_customer_push_subscriptions_order_endpoint;

create unique index if not exists uq_customer_push_subscriptions_tenant_endpoint
  on public.customer_push_subscriptions (tenant_id, endpoint);

create index if not exists idx_customer_push_subscriptions_customer_phone
  on public.customer_push_subscriptions (tenant_id, customer_phone);

create index if not exists idx_customer_push_subscriptions_customer_name
  on public.customer_push_subscriptions (tenant_id, customer_name);

commit;
