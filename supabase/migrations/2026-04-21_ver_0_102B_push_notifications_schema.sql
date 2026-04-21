-- Orduva Ver-0.102B
-- Supabase schema for admin push subscriptions and notification events

begin;

create extension if not exists pgcrypto;

create table if not exists public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  admin_user_id uuid null,
  admin_email text null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text null,
  device_label text null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_admin_push_subscriptions_tenant_id
  on public.admin_push_subscriptions (tenant_id);

create index if not exists idx_admin_push_subscriptions_enabled
  on public.admin_push_subscriptions (enabled);

create index if not exists idx_admin_push_subscriptions_tenant_enabled
  on public.admin_push_subscriptions (tenant_id, enabled);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid null references public.orders(id) on delete cascade,
  audience text not null check (audience in ('admin','customer')),
  event_type text not null,
  title text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed','cancelled')),
  channel text not null default 'push' check (channel in ('push','email','sms','whatsapp','in_app')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz null,
  failed_at timestamptz null,
  error_message text null
);

create index if not exists idx_notification_events_tenant_id
  on public.notification_events (tenant_id);

create index if not exists idx_notification_events_order_id
  on public.notification_events (order_id);

create index if not exists idx_notification_events_status
  on public.notification_events (status);

create index if not exists idx_notification_events_audience_status
  on public.notification_events (audience, status);

create or replace function public.set_updated_at_admin_push_subscriptions()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.last_seen_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_admin_push_subscriptions on public.admin_push_subscriptions;

create trigger trg_set_updated_at_admin_push_subscriptions
before update on public.admin_push_subscriptions
for each row
execute function public.set_updated_at_admin_push_subscriptions();

alter table public.admin_push_subscriptions enable row level security;
alter table public.notification_events enable row level security;

-- Service role full access
drop policy if exists "service_role_full_access_admin_push_subscriptions" on public.admin_push_subscriptions;
create policy "service_role_full_access_admin_push_subscriptions"
on public.admin_push_subscriptions
for all
to service_role
using (true)
with check (true);

drop policy if exists "service_role_full_access_notification_events" on public.notification_events;
create policy "service_role_full_access_notification_events"
on public.notification_events
for all
to service_role
using (true)
with check (true);

-- Authenticated users can read their tenant-scoped push subscriptions if tenant_id is present in JWT app metadata.
drop policy if exists "authenticated_read_admin_push_subscriptions_same_tenant" on public.admin_push_subscriptions;
create policy "authenticated_read_admin_push_subscriptions_same_tenant"
on public.admin_push_subscriptions
for select
to authenticated
using (
  tenant_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')
);

-- Authenticated users can insert/update their tenant-scoped subscriptions.
drop policy if exists "authenticated_write_admin_push_subscriptions_same_tenant" on public.admin_push_subscriptions;
create policy "authenticated_write_admin_push_subscriptions_same_tenant"
on public.admin_push_subscriptions
for insert
to authenticated
with check (
  tenant_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')
);

drop policy if exists "authenticated_update_admin_push_subscriptions_same_tenant" on public.admin_push_subscriptions;
create policy "authenticated_update_admin_push_subscriptions_same_tenant"
on public.admin_push_subscriptions
for update
to authenticated
using (
  tenant_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')
)
with check (
  tenant_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')
);

-- Notification events are usually server-written; allow tenant-scoped authenticated read only.
drop policy if exists "authenticated_read_notification_events_same_tenant" on public.notification_events;
create policy "authenticated_read_notification_events_same_tenant"
on public.notification_events
for select
to authenticated
using (
  tenant_id::text = coalesce(auth.jwt() -> 'app_metadata' ->> 'tenant_id', '')
);

commit;
