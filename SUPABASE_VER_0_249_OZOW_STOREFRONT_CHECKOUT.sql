-- Orduva Ver-0.249 — Ozow ZAR Storefront Checkout
-- Run in Supabase SQL Editor before deploying Ver-0.249.
-- Adds Ozow settings for South African Rand stores and Ozow references on payment intents.

begin;

alter table public.tenant_settings
  add column if not exists enable_ozow_customer_payments boolean not null default false,
  add column if not exists ozow_connection_status text not null default 'not_configured',
  add column if not exists ozow_customer_mode text not null default 'test',
  add column if not exists ozow_site_code text,
  add column if not exists ozow_private_key text,
  add column if not exists ozow_api_key text,
  add column if not exists ozow_account_label text,
  add column if not exists ozow_setup_notes text,
  add column if not exists ozow_payments_live boolean not null default false;

alter table public.tenant_settings
  drop constraint if exists tenant_settings_ozow_connection_status_check;

alter table public.tenant_settings
  add constraint tenant_settings_ozow_connection_status_check
  check (ozow_connection_status in ('not_configured', 'configured', 'connected', 'active', 'disabled'));

alter table public.tenant_settings
  drop constraint if exists tenant_settings_ozow_customer_mode_check;

alter table public.tenant_settings
  add constraint tenant_settings_ozow_customer_mode_check
  check (ozow_customer_mode in ('test', 'live'));

alter table public.storefront_payment_intents
  add column if not exists ozow_transaction_reference text,
  add column if not exists ozow_transaction_id text;

alter table public.storefront_payment_intents
  drop constraint if exists storefront_payment_intents_provider_check;

alter table public.storefront_payment_intents
  add constraint storefront_payment_intents_provider_check
  check (provider in ('stripe', 'yoco', 'mpesa', 'daraja', 'ozow'));

alter table public.orders
  drop constraint if exists orders_payment_provider_check;

alter table public.orders
  add constraint orders_payment_provider_check
  check (payment_provider in ('cash', 'cod', 'stripe', 'yoco', 'mpesa', 'daraja', 'ozow', 'manual'));

create unique index if not exists storefront_payment_intents_ozow_transaction_reference_uidx
  on public.storefront_payment_intents (ozow_transaction_reference)
  where ozow_transaction_reference is not null;

create index if not exists storefront_payment_intents_ozow_transaction_id_idx
  on public.storefront_payment_intents (ozow_transaction_id)
  where ozow_transaction_id is not null;

comment on column public.tenant_settings.enable_ozow_customer_payments is 'Enables Ozow setup for ZAR storefront customer checkout.';
comment on column public.tenant_settings.ozow_site_code is 'Ozow SiteCode for the store owner merchant account.';
comment on column public.tenant_settings.ozow_private_key is 'Ozow Private Key used server-side to sign and verify Ozow requests.';
comment on column public.storefront_payment_intents.ozow_transaction_reference is 'Ozow TransactionReference sent to Ozow for hosted checkout.';
comment on column public.storefront_payment_intents.ozow_transaction_id is 'Ozow TransactionId returned in payment notification/response.';

commit;
