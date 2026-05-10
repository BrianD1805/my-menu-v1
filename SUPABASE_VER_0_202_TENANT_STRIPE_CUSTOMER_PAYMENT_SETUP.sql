-- Orduva Ver-0.202 — tenant Stripe customer payment setup foundation
-- Adds tenant-owned Stripe credential/settings fields for future storefront customer payments.
-- These are separate from the Orduva owner Stripe account used for SaaS billing.

alter table public.tenant_settings
  add column if not exists stripe_customer_payment_mode text not null default 'manual_keys',
  add column if not exists stripe_customer_publishable_key text,
  add column if not exists stripe_customer_secret_key text,
  add column if not exists stripe_customer_webhook_secret text,
  add column if not exists stripe_customer_account_label text,
  add column if not exists stripe_customer_test_mode boolean not null default true,
  add column if not exists stripe_customer_setup_notes text,
  add column if not exists stripe_customer_payments_live boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_stripe_customer_payment_mode_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_stripe_customer_payment_mode_check
      check (stripe_customer_payment_mode in ('manual_keys', 'stripe_connect'));
  end if;
end $$;

create index if not exists tenant_settings_stripe_customer_payment_mode_idx on public.tenant_settings (stripe_customer_payment_mode);
create index if not exists tenant_settings_stripe_customer_payments_live_idx on public.tenant_settings (stripe_customer_payments_live);
