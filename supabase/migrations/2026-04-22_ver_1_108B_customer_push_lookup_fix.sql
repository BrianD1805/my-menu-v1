begin;

create unique index if not exists uq_customer_push_subscriptions_tenant_endpoint
  on public.customer_push_subscriptions (tenant_id, endpoint);

create index if not exists idx_customer_push_subscriptions_customer_phone
  on public.customer_push_subscriptions (tenant_id, customer_phone);

create index if not exists idx_customer_push_subscriptions_customer_name
  on public.customer_push_subscriptions (tenant_id, customer_name);

commit;
