-- Orduva Ver-0.203 — tenant Stripe storefront checkout
-- Adds Stripe checkout tracking fields for customer storefront orders.
-- Tenant Stripe uses the tenant/store owner's own Stripe account credentials,
-- not the Orduva owner billing Stripe account.

alter table public.orders
  add column if not exists payment_checkout_session_id text,
  add column if not exists payment_intent_id text;

create index if not exists orders_payment_checkout_session_idx on public.orders (payment_checkout_session_id);
create index if not exists orders_payment_intent_idx on public.orders (payment_intent_id);

-- These columns should already exist from Ver-0.201A/0.202, but are kept here
-- to make this patch safe if the SQL is run on a slightly older database.
alter table public.orders
  add column if not exists payment_provider text not null default 'cod',
  add column if not exists payment_method_label text,
  add column if not exists payment_status text not null default 'pay_on_fulfilment',
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz;

alter table public.tenant_settings
  add column if not exists enable_stripe_customer_payments boolean not null default false,
  add column if not exists stripe_connection_status text not null default 'not_configured',
  add column if not exists stripe_customer_publishable_key text,
  add column if not exists stripe_customer_secret_key text,
  add column if not exists stripe_customer_webhook_secret text,
  add column if not exists stripe_customer_payments_live boolean not null default false;

create index if not exists tenant_settings_stripe_customer_payments_live_idx on public.tenant_settings (stripe_customer_payments_live);
