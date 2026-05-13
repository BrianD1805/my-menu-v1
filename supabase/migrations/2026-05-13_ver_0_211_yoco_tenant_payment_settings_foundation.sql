-- Orduva Ver-0.211 — Yoco Tenant Payment Settings Foundation
-- Run in Supabase SQL Editor before deploying Ver-0.211.
-- Adds tenant-owned Yoco credential storage and setup fields for South African ZAR storefront payments.
-- This is a foundation patch only: customer checkout activation remains off until the Yoco checkout/webhook patch is added.

alter table public.tenant_settings
  add column if not exists yoco_customer_mode text not null default 'test',
  add column if not exists yoco_customer_secret_key text,
  add column if not exists yoco_customer_webhook_secret text,
  add column if not exists yoco_customer_account_label text,
  add column if not exists yoco_customer_setup_notes text,
  add column if not exists yoco_customer_payments_live boolean not null default false;

alter table public.tenant_settings
  drop constraint if exists tenant_settings_yoco_customer_mode_check;

alter table public.tenant_settings
  add constraint tenant_settings_yoco_customer_mode_check
  check (yoco_customer_mode in ('test', 'live'));

update public.tenant_settings
set
  yoco_customer_mode = coalesce(yoco_customer_mode, 'test'),
  yoco_customer_payments_live = false
where yoco_customer_mode is null
   or yoco_customer_payments_live is distinct from false;

create index if not exists tenant_settings_yoco_enabled_idx
  on public.tenant_settings (enable_yoco_customer_payments, yoco_connection_status, yoco_customer_payments_live);

comment on column public.tenant_settings.yoco_customer_mode is 'Tenant Yoco credential mode. Ver-0.211 supports test/live storage for future customer checkout.';
comment on column public.tenant_settings.yoco_customer_secret_key is 'Tenant-owned Yoco secret key. Server-side only; never returned to browser clients.';
comment on column public.tenant_settings.yoco_customer_webhook_secret is 'Tenant Yoco webhook signing secret/key when available. Server-side only.';
comment on column public.tenant_settings.yoco_customer_account_label is 'Friendly internal label for the tenant Yoco account.';
comment on column public.tenant_settings.yoco_customer_setup_notes is 'Owner/admin notes for tenant Yoco setup.';
comment on column public.tenant_settings.yoco_customer_payments_live is 'False in Ver-0.211. Set true only after the Yoco checkout and webhook flow is implemented and tested.';
