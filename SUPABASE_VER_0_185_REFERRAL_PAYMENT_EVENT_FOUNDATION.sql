-- Orduva Ver-0.185 — Referral payment event foundation
-- Run in Supabase SQL Editor before deploying Ver-0.185.
-- Adds a monthly subscription payment ledger that can later receive Stripe, Yoco and Pesapal webhook events.
-- Manual records created from /platform/referrals now automatically create the tenant referral credit.

create table if not exists public.tenant_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  referral_reward_id uuid references public.referral_rewards(id) on delete set null,
  referral_signup_id uuid references public.referral_signups(id) on delete set null,
  billing_period_month date not null,
  subscription_amount numeric(12,2) not null default 0,
  currency_code text not null default 'GBP',
  payment_source text not null default 'manual',
  payment_status text not null default 'paid',
  payment_reference text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_subscription_payments_source_check check (payment_source in ('manual', 'stripe', 'yoco', 'pesapal', 'owner_adjustment')),
  constraint tenant_subscription_payments_status_check check (payment_status in ('paid', 'refunded', 'void')),
  constraint tenant_subscription_payments_amount_check check (subscription_amount >= 0)
);

alter table public.referral_reward_credits
  add column if not exists payment_event_id uuid references public.tenant_subscription_payments(id) on delete set null;

create index if not exists tenant_subscription_payments_tenant_id_idx on public.tenant_subscription_payments (tenant_id);
create index if not exists tenant_subscription_payments_referral_reward_id_idx on public.tenant_subscription_payments (referral_reward_id);
create index if not exists tenant_subscription_payments_referral_signup_id_idx on public.tenant_subscription_payments (referral_signup_id);
create index if not exists tenant_subscription_payments_billing_period_month_idx on public.tenant_subscription_payments (billing_period_month);
create index if not exists tenant_subscription_payments_payment_source_idx on public.tenant_subscription_payments (payment_source);
create index if not exists tenant_subscription_payments_payment_status_idx on public.tenant_subscription_payments (payment_status);
create index if not exists referral_reward_credits_payment_event_id_idx on public.referral_reward_credits (payment_event_id);

-- Prevent duplicate live monthly payment events from the same source for the same tenant/month.
-- Voided rows are ignored so a mistaken manual record can be voided and recreated later if needed.
create unique index if not exists tenant_subscription_payments_unique_live_month_source_idx
  on public.tenant_subscription_payments (tenant_id, billing_period_month, payment_source)
  where payment_status <> 'void';

alter table public.tenant_subscription_payments enable row level security;

-- Intentionally no anon/authenticated policies.
-- Owner/platform payment and reward records must be accessed only by trusted server-side routes using the Supabase service role key.

comment on table public.tenant_subscription_payments is 'Monthly Orduva subscription payment events per tenant. Manual entries are supported now; Stripe/Yoco/Pesapal webhook events can use the same ledger later.';
comment on column public.tenant_subscription_payments.billing_period_month is 'First day of the paid monthly subscription period.';
comment on column public.referral_reward_credits.payment_event_id is 'Subscription payment event that generated this referral credit, when available.';
