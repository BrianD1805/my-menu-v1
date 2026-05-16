create extension if not exists pgcrypto;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active',
  whatsapp_number text,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  price numeric(10,2) not null,
  is_active boolean not null default true,
  stock_enabled boolean not null default false,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  order_type text not null default 'delivery',
  status text not null default 'new',
  total numeric(10,2) not null,
  notes text,
  whatsapp_message text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,
  unit_price numeric(10,2) not null,
  quantity int not null,
  line_total numeric(10,2) not null
);

alter table public.tenants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;


create table if not exists admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  tenant_user_id uuid,
  endpoint text not null unique,
  p256dh_key text not null,
  auth_key text not null,
  expiration_time bigint,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notification_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  order_id uuid references orders(id) on delete cascade,
  audience text not null,
  channel text not null default 'push',
  event_type text not null,
  title text not null,
  body text not null,
  payload jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.admin_push_subscriptions enable row level security;
alter table public.notification_events enable row level security;

-- Ver-0.201A storefront payment options foundation
alter table public.tenant_settings
  add column if not exists enable_cash_on_collection boolean not null default true,
  add column if not exists enable_cash_on_delivery boolean not null default true,
  add column if not exists enable_stripe_customer_payments boolean not null default false,
  add column if not exists stripe_connection_status text not null default 'not_configured',
  add column if not exists enable_yoco_customer_payments boolean not null default false,
  add column if not exists yoco_connection_status text not null default 'not_configured',
  add column if not exists enable_mpesa_customer_payments boolean not null default false,
  add column if not exists mpesa_connection_status text not null default 'not_configured',
  add column if not exists mpesa_customer_mode text not null default 'test',
  add column if not exists mpesa_customer_consumer_key text,
  add column if not exists mpesa_customer_consumer_secret text,
  add column if not exists mpesa_customer_ipn_id text,
  add column if not exists mpesa_customer_account_label text,
  add column if not exists mpesa_customer_setup_notes text,
  add column if not exists mpesa_customer_payments_live boolean not null default false;

alter table public.orders
  add column if not exists payment_provider text not null default 'cod',
  add column if not exists payment_method_label text,
  add column if not exists payment_status text not null default 'pay_on_fulfilment',
  add column if not exists payment_reference text,
  add column if not exists paid_at timestamptz;

-- Ver-0.202 tenant Stripe customer payment setup foundation
alter table public.tenant_settings
  add column if not exists stripe_customer_payment_mode text not null default 'manual_keys',
  add column if not exists stripe_customer_publishable_key text,
  add column if not exists stripe_customer_secret_key text,
  add column if not exists stripe_customer_webhook_secret text,
  add column if not exists stripe_customer_account_label text,
  add column if not exists stripe_customer_test_mode boolean not null default true,
  add column if not exists stripe_customer_setup_notes text,
  add column if not exists stripe_customer_payments_live boolean not null default false;
-- Orduva Ver-0.203A — Stripe storefront order-after-payment fix
-- Stripe customer checkouts now create a pending payment intent first.
-- The real order and stock deduction happen only after Stripe confirms payment.

create table if not exists public.storefront_payment_intents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider text not null default 'stripe',
  status text not null default 'created',
  order_id uuid references public.orders(id) on delete set null,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  pesapal_order_tracking_id text,
  pesapal_merchant_reference text,
  amount_total numeric not null default 0,
  currency_code text not null default 'GBP',
  customer_name text,
  customer_phone text,
  order_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'storefront_payment_intents_provider_check'
  ) then
    alter table public.storefront_payment_intents
      add constraint storefront_payment_intents_provider_check
      check (provider in ('stripe', 'yoco', 'mpesa'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'storefront_payment_intents_status_check'
  ) then
    alter table public.storefront_payment_intents
      add constraint storefront_payment_intents_status_check
      check (status in ('created', 'checkout_started', 'paid', 'failed', 'cancelled', 'expired', 'refunded'));
  end if;
end $$;

create index if not exists storefront_payment_intents_tenant_idx on public.storefront_payment_intents (tenant_id);
create index if not exists storefront_payment_intents_status_idx on public.storefront_payment_intents (status);
create index if not exists storefront_payment_intents_order_idx on public.storefront_payment_intents (order_id);
create unique index if not exists storefront_payment_intents_stripe_session_uidx
  on public.storefront_payment_intents (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
create index if not exists storefront_payment_intents_stripe_payment_intent_idx
  on public.storefront_payment_intents (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;
create unique index if not exists storefront_payment_intents_pesapal_tracking_uidx
  on public.storefront_payment_intents (pesapal_order_tracking_id)
  where pesapal_order_tracking_id is not null;
create index if not exists storefront_payment_intents_pesapal_reference_idx
  on public.storefront_payment_intents (pesapal_merchant_reference)
  where pesapal_merchant_reference is not null;
