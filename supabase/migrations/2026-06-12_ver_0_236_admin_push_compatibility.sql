-- Orduva Ver-0.236 — Admin push subscription compatibility/backfill
-- Run in Supabase SQL Editor before testing new-order admin push notifications.
-- Keeps old and new admin push subscription column names aligned so existing saved devices can receive new-order pushes.

alter table public.admin_push_subscriptions
  add column if not exists admin_user_id uuid,
  add column if not exists admin_email text,
  add column if not exists p256dh text,
  add column if not exists auth text,
  add column if not exists p256dh_key text,
  add column if not exists auth_key text,
  add column if not exists enabled boolean not null default true,
  add column if not exists is_active boolean not null default true,
  add column if not exists device_label text,
  add column if not exists last_seen_at timestamptz;

update public.admin_push_subscriptions
set
  p256dh = coalesce(p256dh, p256dh_key),
  auth = coalesce(auth, auth_key),
  p256dh_key = coalesce(p256dh_key, p256dh),
  auth_key = coalesce(auth_key, auth),
  enabled = coalesce(enabled, is_active, true),
  is_active = coalesce(is_active, enabled, true),
  last_seen_at = coalesce(last_seen_at, updated_at, now()),
  updated_at = now()
where p256dh is null
   or auth is null
   or p256dh_key is null
   or auth_key is null
   or last_seen_at is null;

create unique index if not exists admin_push_subscriptions_endpoint_unique_idx
  on public.admin_push_subscriptions (endpoint);

create index if not exists admin_push_subscriptions_tenant_enabled_idx
  on public.admin_push_subscriptions (tenant_id, enabled, is_active, updated_at desc);

grant select, insert, update, delete
on public.admin_push_subscriptions
to service_role;

grant select, insert, update, delete
on public.notification_events
to service_role;
