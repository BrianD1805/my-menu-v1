-- Orduva Ver-0.213 — Yoco Webhook Setup + Paid Order Confirmation
-- Run in Supabase SQL Editor before deploying Ver-0.213.
-- Adds Yoco webhook metadata storage and a webhook event ledger so paid Yoco storefront orders
-- can be confirmed safely by webhook as well as by the return-page status check.

alter table public.tenant_settings
  add column if not exists yoco_customer_webhook_id text,
  add column if not exists yoco_customer_webhook_url text;

create table if not exists public.storefront_yoco_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  webhook_id text,
  tenant_id uuid references public.tenants(id) on delete set null,
  checkout_id uuid references public.storefront_payment_intents(id) on delete set null,
  yoco_checkout_id text,
  yoco_payment_id text,
  event_type text,
  status text not null default 'processing',
  message text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint storefront_yoco_webhook_events_status_check check (status in ('processing', 'processed', 'ignored', 'failed'))
);

create index if not exists storefront_yoco_webhook_events_tenant_created_idx
  on public.storefront_yoco_webhook_events (tenant_id, created_at desc);

create index if not exists storefront_yoco_webhook_events_checkout_idx
  on public.storefront_yoco_webhook_events (checkout_id);

create index if not exists storefront_yoco_webhook_events_yoco_checkout_idx
  on public.storefront_yoco_webhook_events (yoco_checkout_id);

create index if not exists storefront_yoco_webhook_events_status_idx
  on public.storefront_yoco_webhook_events (status, created_at desc);

create index if not exists tenant_settings_yoco_webhook_id_idx
  on public.tenant_settings (yoco_customer_webhook_id)
  where yoco_customer_webhook_id is not null;

alter table public.storefront_yoco_webhook_events enable row level security;

-- Intentionally no anon/authenticated policies.
-- Yoco webhook events are inserted/read through trusted server-side routes using the service role.

comment on column public.tenant_settings.yoco_customer_webhook_id is 'Yoco webhook subscription ID created by Orduva for tenant storefront payments.';
comment on column public.tenant_settings.yoco_customer_webhook_url is 'Yoco webhook endpoint URL registered for tenant storefront payments.';
comment on table public.storefront_yoco_webhook_events is 'Yoco storefront webhook delivery ledger for idempotent paid order confirmation and troubleshooting.';
