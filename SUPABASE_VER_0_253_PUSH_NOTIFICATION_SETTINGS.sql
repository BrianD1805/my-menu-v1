-- Orduva Ver-0.253 — Push notification settings and editable templates
-- Run in Supabase SQL Editor before testing Ver-0.253.

begin;

create table if not exists public.tenant_push_notification_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  audience text not null check (audience in ('admin', 'customer')),
  event_type text not null,
  title_template text not null,
  body_template text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, audience, event_type)
);

create index if not exists tenant_push_notification_settings_tenant_idx
  on public.tenant_push_notification_settings (tenant_id, audience, event_type);

create or replace function public.set_tenant_push_notification_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tenant_push_notification_settings_set_updated_at on public.tenant_push_notification_settings;
create trigger tenant_push_notification_settings_set_updated_at
before update on public.tenant_push_notification_settings
for each row
execute function public.set_tenant_push_notification_settings_updated_at();

grant select, insert, update, delete
on public.tenant_push_notification_settings
to service_role;

comment on table public.tenant_push_notification_settings is 'Store-specific push notification wording and enabled/disabled controls for Store Admin and customer order-flow pushes.';
comment on column public.tenant_push_notification_settings.enabled is 'When false, the order status flow still changes but the matching web push is skipped.';

commit;
