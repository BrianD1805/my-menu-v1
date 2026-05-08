-- Orduva Ver-0.183 — Referral rewards dashboard
-- Run in Supabase SQL Editor before deploying Ver-0.183.
-- Adds changeable monthly referral reward rules and a monthly credit ledger.

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referral_signup_id uuid not null references public.referral_signups(id) on delete cascade,
  referral_source_id uuid references public.referral_sources(id) on delete set null,
  referrer_tenant_id uuid references public.tenants(id) on delete set null,
  referred_tenant_id uuid references public.tenants(id) on delete set null,
  reward_rate_percent numeric(5,2) not null default 15,
  monthly_subscription_amount numeric(12,2) not null default 0,
  estimated_monthly_reward numeric(12,2) not null default 0,
  currency_code text not null default 'GBP',
  reward_status text not null default 'trial',
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_rewards_signup_unique unique (referral_signup_id),
  constraint referral_rewards_rate_check check (reward_rate_percent >= 0 and reward_rate_percent <= 100),
  constraint referral_rewards_status_check check (reward_status in ('trial', 'active', 'paused', 'cancelled'))
);

create table if not exists public.referral_reward_credits (
  id uuid primary key default gen_random_uuid(),
  reward_rule_id uuid not null references public.referral_rewards(id) on delete cascade,
  referral_signup_id uuid references public.referral_signups(id) on delete set null,
  referral_source_id uuid references public.referral_sources(id) on delete set null,
  referrer_tenant_id uuid references public.tenants(id) on delete set null,
  referred_tenant_id uuid references public.tenants(id) on delete set null,
  paid_month date not null,
  subscription_amount numeric(12,2) not null default 0,
  reward_rate_percent numeric(5,2) not null default 15,
  reward_amount numeric(12,2) not null default 0,
  currency_code text not null default 'GBP',
  credit_status text not null default 'pending',
  payment_reference text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_reward_credits_month_unique unique (reward_rule_id, paid_month),
  constraint referral_reward_credits_rate_check check (reward_rate_percent >= 0 and reward_rate_percent <= 100),
  constraint referral_reward_credits_status_check check (credit_status in ('pending', 'credited', 'paid', 'void'))
);

insert into public.referral_rewards (
  referral_signup_id,
  referral_source_id,
  referrer_tenant_id,
  referred_tenant_id,
  reward_rate_percent,
  monthly_subscription_amount,
  estimated_monthly_reward,
  currency_code,
  reward_status,
  updated_at
)
select
  rs.id,
  rs.referral_source_id,
  src.referrer_tenant_id,
  rs.referred_tenant_id,
  coalesce(rs.reward_rate_percent, src.reward_rate_percent, 15),
  0,
  0,
  'GBP',
  case
    when rs.status in ('converted', 'active_reward') then 'active'
    when rs.status = 'cancelled' then 'cancelled'
    else 'trial'
  end,
  now()
from public.referral_signups rs
left join public.referral_sources src on src.id = rs.referral_source_id
where rs.referred_tenant_id is not null
on conflict (referral_signup_id) do nothing;

create index if not exists referral_rewards_referrer_tenant_id_idx on public.referral_rewards (referrer_tenant_id);
create index if not exists referral_rewards_referred_tenant_id_idx on public.referral_rewards (referred_tenant_id);
create index if not exists referral_rewards_reward_status_idx on public.referral_rewards (reward_status);
create index if not exists referral_reward_credits_reward_rule_id_idx on public.referral_reward_credits (reward_rule_id);
create index if not exists referral_reward_credits_referrer_tenant_id_idx on public.referral_reward_credits (referrer_tenant_id);
create index if not exists referral_reward_credits_referred_tenant_id_idx on public.referral_reward_credits (referred_tenant_id);
create index if not exists referral_reward_credits_paid_month_idx on public.referral_reward_credits (paid_month);
create index if not exists referral_reward_credits_credit_status_idx on public.referral_reward_credits (credit_status);

alter table public.referral_rewards enable row level security;
alter table public.referral_reward_credits enable row level security;

-- Intentionally no anon/authenticated policies.
-- These owner/platform reward records should be accessed only by trusted server-side routes using the Supabase service role key.

comment on table public.referral_rewards is 'Changeable monthly referral reward rule for each captured signup.';
comment on table public.referral_reward_credits is 'Monthly referral credit ledger. Add one row each time the referred tenant pays their monthly subscription.';
comment on column public.referral_rewards.reward_rate_percent is 'The reward percentage applied to the referred tenant monthly subscription. Default is 15 but it is owner-changeable.';
comment on column public.referral_reward_credits.reward_amount is 'The calculated tenant credit for that paid month.';
