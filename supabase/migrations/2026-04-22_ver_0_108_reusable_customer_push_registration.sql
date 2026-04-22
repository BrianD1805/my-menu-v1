begin;

-- Ver-0.108 reusable customer device push registration
-- allow upsert by tenant + endpoint so one device can be reused across multiple future orders

create unique index if not exists uq_customer_push_subscriptions_tenant_endpoint
  on public.customer_push_subscriptions (tenant_id, endpoint);

commit;
