-- Orduva Ver-0.201A — storefront cash/COD payment foundation
-- Adds tenant payment provider settings and order payment tracking without using the Orduva owner Stripe account for customer storefront payments.

alter table public.tenant_settings
  add column if not exists enable_cash_on_collection boolean not null default true,
  add column if not exists enable_cash_on_delivery boolean not null default true,
  add column if not exists enable_stripe_customer_payments boolean not null default false,
  add column if not exists stripe_connection_status text not null default 'not_configured',
  add column if not exists enable_yoco_customer_payments boolean not null default false,
  add column if not exists yoco_connection_status text not null default 'not_configured',
  add column if not exists enable_mpesa_customer_payments boolean not null default false,
  add column if not exists mpesa_connection_status text not null default 'not_configured';

alter table public.orders
  add column if not exists payment_provider text not null default 'cod',
  add column if not exists payment_method_label text,
  add column if not exists payment_status text not null default 'pay_on_fulfilment',
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_stripe_connection_status_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_stripe_connection_status_check
      check (stripe_connection_status in ('not_configured', 'configured', 'connected', 'active', 'disabled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_yoco_connection_status_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_yoco_connection_status_check
      check (yoco_connection_status in ('not_configured', 'configured', 'connected', 'active', 'disabled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_mpesa_connection_status_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_mpesa_connection_status_check
      check (mpesa_connection_status in ('not_configured', 'configured', 'connected', 'active', 'disabled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_provider_check'
  ) then
    alter table public.orders
      add constraint orders_payment_provider_check
      check (payment_provider in ('cash', 'cod', 'stripe', 'yoco', 'mpesa', 'manual'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_status_check'
  ) then
    alter table public.orders
      add constraint orders_payment_status_check
      check (payment_status in ('pay_on_fulfilment', 'pending_online_payment', 'paid', 'failed', 'cancelled', 'refunded'));
  end if;
end $$;

create index if not exists orders_payment_provider_idx on public.orders (payment_provider);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_paid_at_idx on public.orders (paid_at);
