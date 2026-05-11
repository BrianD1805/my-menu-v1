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
