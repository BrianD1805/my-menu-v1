-- Orduva Ver-0.250 — PayFast ZAR Storefront Checkout
-- Run in Supabase SQL Editor before deploying Ver-0.250.
-- Adds PayFast settings for South African Rand stores and PayFast references on payment intents.

begin;

alter table public.tenant_settings
  add column if not exists enable_payfast_customer_payments boolean not null default false,
  add column if not exists payfast_connection_status text not null default 'not_configured',
  add column if not exists payfast_customer_mode text not null default 'test',
  add column if not exists payfast_merchant_id text,
  add column if not exists payfast_merchant_key text,
  add column if not exists payfast_passphrase text,
  add column if not exists payfast_account_label text,
  add column if not exists payfast_setup_notes text,
  add column if not exists payfast_payments_live boolean not null default false;

alter table public.tenant_settings
  drop constraint if exists tenant_settings_payfast_connection_status_check;

alter table public.tenant_settings
  add constraint tenant_settings_payfast_connection_status_check
  check (payfast_connection_status in ('not_configured', 'configured', 'connected', 'active', 'disabled'));

alter table public.tenant_settings
  drop constraint if exists tenant_settings_payfast_customer_mode_check;

alter table public.tenant_settings
  add constraint tenant_settings_payfast_customer_mode_check
  check (payfast_customer_mode in ('test', 'live'));

alter table public.storefront_payment_intents
  add column if not exists payfast_transaction_reference text,
  add column if not exists payfast_transaction_id text;

alter table public.storefront_payment_intents
  drop constraint if exists storefront_payment_intents_provider_check;

alter table public.storefront_payment_intents
  add constraint storefront_payment_intents_provider_check
  check (provider in ('stripe', 'yoco', 'mpesa', 'daraja', 'ozow', 'payfast'));

alter table public.orders
  drop constraint if exists orders_payment_provider_check;

alter table public.orders
  add constraint orders_payment_provider_check
  check (payment_provider in ('cash', 'cod', 'stripe', 'yoco', 'mpesa', 'daraja', 'ozow', 'payfast', 'manual'));

create unique index if not exists storefront_payment_intents_payfast_transaction_reference_uidx
  on public.storefront_payment_intents (payfast_transaction_reference)
  where payfast_transaction_reference is not null;

create index if not exists storefront_payment_intents_payfast_transaction_id_idx
  on public.storefront_payment_intents (payfast_transaction_id)
  where payfast_transaction_id is not null;

comment on column public.tenant_settings.enable_payfast_customer_payments is 'Enables PayFast setup for ZAR storefront customer checkout.';
comment on column public.tenant_settings.payfast_merchant_id is 'PayFast Merchant ID for the store owner merchant account.';
comment on column public.tenant_settings.payfast_merchant_key is 'PayFast Merchant Key used in hosted checkout form posts.';
comment on column public.tenant_settings.payfast_passphrase is 'Optional PayFast security passphrase used server-side to sign and verify requests.';
comment on column public.storefront_payment_intents.payfast_transaction_reference is 'PayFast m_payment_id sent to PayFast for hosted checkout.';
comment on column public.storefront_payment_intents.payfast_transaction_id is 'PayFast pf_payment_id returned in the ITN payment notification.';

commit;
