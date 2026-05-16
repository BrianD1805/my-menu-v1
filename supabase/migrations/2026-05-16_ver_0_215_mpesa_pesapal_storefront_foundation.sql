-- Orduva Ver-0.215 — M-Pesa via Pesapal Storefront Payment Foundation
-- Run in Supabase SQL Editor before deploying Ver-0.215.
-- Adds tenant Pesapal credentials/settings and Pesapal tracking references on storefront payment intents.

alter table public.tenant_settings
  add column if not exists mpesa_customer_mode text not null default 'test',
  add column if not exists mpesa_customer_consumer_key text,
  add column if not exists mpesa_customer_consumer_secret text,
  add column if not exists mpesa_customer_ipn_id text,
  add column if not exists mpesa_customer_account_label text,
  add column if not exists mpesa_customer_setup_notes text,
  add column if not exists mpesa_customer_payments_live boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_mpesa_customer_mode_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_mpesa_customer_mode_check
      check (mpesa_customer_mode in ('test', 'live'));
  end if;
end $$;

alter table public.storefront_payment_intents
  add column if not exists pesapal_order_tracking_id text,
  add column if not exists pesapal_merchant_reference text;

create unique index if not exists storefront_payment_intents_pesapal_tracking_uidx
  on public.storefront_payment_intents (pesapal_order_tracking_id)
  where pesapal_order_tracking_id is not null;

create index if not exists storefront_payment_intents_pesapal_reference_idx
  on public.storefront_payment_intents (pesapal_merchant_reference)
  where pesapal_merchant_reference is not null;

comment on column public.tenant_settings.mpesa_customer_mode is 'Pesapal API mode for tenant M-Pesa storefront payments: test or live.';
comment on column public.tenant_settings.mpesa_customer_consumer_key is 'Tenant Pesapal consumer key for M-Pesa storefront payments.';
comment on column public.tenant_settings.mpesa_customer_consumer_secret is 'Tenant Pesapal consumer secret for M-Pesa storefront payments. Server-side only.';
comment on column public.tenant_settings.mpesa_customer_ipn_id is 'Pesapal notification_id returned when the tenant IPN URL is registered.';
comment on column public.storefront_payment_intents.pesapal_order_tracking_id is 'Pesapal order_tracking_id returned by SubmitOrderRequest.';
comment on column public.storefront_payment_intents.pesapal_merchant_reference is 'Merchant reference sent to Pesapal for this Orduva checkout intent.';
