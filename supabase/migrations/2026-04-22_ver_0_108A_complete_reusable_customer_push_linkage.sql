begin;

create unique index if not exists uq_customer_push_subscriptions_tenant_endpoint
  on public.customer_push_subscriptions (tenant_id, endpoint);

commit;
