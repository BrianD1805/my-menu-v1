begin;

create table if not exists public.customer_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  customer_name text null,
  customer_phone text not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists idx_customer_push_subscriptions_order_endpoint
  on public.customer_push_subscriptions (order_id, endpoint);

create index if not exists idx_customer_push_subscriptions_order_enabled
  on public.customer_push_subscriptions (order_id, enabled);

create or replace function public.set_updated_at_customer_push_subscriptions()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.last_seen_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_customer_push_subscriptions on public.customer_push_subscriptions;

create trigger trg_set_updated_at_customer_push_subscriptions
before update on public.customer_push_subscriptions
for each row
execute function public.set_updated_at_customer_push_subscriptions();

alter table public.customer_push_subscriptions enable row level security;

drop policy if exists "service_role_full_access_customer_push_subscriptions" on public.customer_push_subscriptions;
create policy "service_role_full_access_customer_push_subscriptions"
on public.customer_push_subscriptions
for all
to service_role
using (true)
with check (true);

commit;
