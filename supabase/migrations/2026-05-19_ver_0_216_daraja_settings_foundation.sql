-- Orduva Ver-0.216 — Direct M-Pesa Daraja settings foundation
-- Run in Supabase SQL Editor before deploying Ver-0.216.
-- Adds tenant-scoped Safaricom Daraja/STK Push setup fields only.
-- This migration does not enable storefront direct M-Pesa checkout yet.

alter table public.tenant_settings
  add column if not exists enable_daraja_customer_payments boolean not null default false,
  add column if not exists daraja_connection_status text not null default 'not_configured',
  add column if not exists daraja_customer_mode text not null default 'sandbox',
  add column if not exists daraja_consumer_key text,
  add column if not exists daraja_consumer_secret text,
  add column if not exists daraja_shortcode text,
  add column if not exists daraja_passkey text,
  add column if not exists daraja_transaction_type text not null default 'CustomerPayBillOnline',
  add column if not exists daraja_account_reference_prefix text not null default 'ORDUVA',
  add column if not exists daraja_callback_url text,
  add column if not exists daraja_account_label text,
  add column if not exists daraja_setup_notes text,
  add column if not exists daraja_payments_live boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_daraja_customer_mode_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_daraja_customer_mode_check
      check (daraja_customer_mode in ('sandbox', 'live'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_daraja_connection_status_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_daraja_connection_status_check
      check (daraja_connection_status in ('not_configured', 'configured', 'connected', 'active', 'disabled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_daraja_transaction_type_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_daraja_transaction_type_check
      check (daraja_transaction_type in ('CustomerPayBillOnline', 'CustomerBuyGoodsOnline'));
  end if;
end $$;

comment on column public.tenant_settings.enable_daraja_customer_payments is 'Direct Safaricom Daraja/STK Push setup enabled for this tenant. Ver-0.216 stores settings only and does not expose checkout.';
comment on column public.tenant_settings.daraja_customer_mode is 'Safaricom Daraja API mode for future direct M-Pesa STK Push: sandbox or live.';
comment on column public.tenant_settings.daraja_consumer_key is 'Tenant Safaricom Daraja consumer key. Server-side use only.';
comment on column public.tenant_settings.daraja_consumer_secret is 'Tenant Safaricom Daraja consumer secret. Server-side only and never returned to admin UI.';
comment on column public.tenant_settings.daraja_shortcode is 'Tenant M-Pesa shortcode, till or paybill used for STK Push.';
comment on column public.tenant_settings.daraja_passkey is 'Tenant Lipa na M-Pesa Online passkey. Server-side only and never returned to admin UI.';
comment on column public.tenant_settings.daraja_transaction_type is 'Daraja STK Push transaction type: CustomerPayBillOnline or CustomerBuyGoodsOnline.';
comment on column public.tenant_settings.daraja_account_reference_prefix is 'Prefix for future Daraja AccountReference values, e.g. ORDUVA.';
comment on column public.tenant_settings.daraja_callback_url is 'Stored future callback URL/reference for direct M-Pesa Daraja callback handling.';
comment on column public.tenant_settings.daraja_payments_live is 'Reserved for a future checkout build. Forced false in Ver-0.216.';
