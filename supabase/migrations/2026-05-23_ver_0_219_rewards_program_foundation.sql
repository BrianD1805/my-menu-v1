-- Orduva Ver-0.219 — Rewards programme foundation
-- Run in Supabase SQL Editor before deploying Ver-0.219.
-- Adds tenant-controlled Silver/Gold/Platinum reward settings and order-level reward audit fields.

alter table public.tenant_settings
  add column if not exists rewards_enabled boolean not null default false,
  add column if not exists rewards_program_name text not null default 'Rewards Club',
  add column if not exists rewards_silver_min_spend numeric(10,2) not null default 0,
  add column if not exists rewards_silver_discount_percent numeric(5,2) not null default 0,
  add column if not exists rewards_gold_min_spend numeric(10,2) not null default 1000,
  add column if not exists rewards_gold_discount_percent numeric(5,2) not null default 5,
  add column if not exists rewards_platinum_min_spend numeric(10,2) not null default 2500,
  add column if not exists rewards_platinum_discount_percent numeric(5,2) not null default 10;

alter table public.customer_accounts
  add column if not exists reward_enrolled_at timestamptz not null default now();

update public.customer_accounts
set reward_enrolled_at = coalesce(reward_enrolled_at, created_at, now())
where reward_enrolled_at is null;

alter table public.orders
  add column if not exists subtotal_total numeric(10,2),
  add column if not exists reward_tier text,
  add column if not exists reward_discount_percent numeric(5,2) not null default 0,
  add column if not exists reward_discount_amount numeric(10,2) not null default 0,
  add column if not exists rewards_spend_before numeric(10,2),
  add column if not exists rewards_spend_after numeric(10,2);

update public.orders
set subtotal_total = coalesce(subtotal_total, total)
where subtotal_total is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_reward_percent_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_reward_percent_check
      check (
        rewards_silver_discount_percent between 0 and 95 and
        rewards_gold_discount_percent between 0 and 95 and
        rewards_platinum_discount_percent between 0 and 95
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_reward_threshold_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_reward_threshold_check
      check (
        rewards_silver_min_spend = 0 and
        rewards_gold_min_spend >= 0 and
        rewards_platinum_min_spend >= rewards_gold_min_spend
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_reward_tier_check'
  ) then
    alter table public.orders
      add constraint orders_reward_tier_check
      check (reward_tier is null or reward_tier in ('silver', 'gold', 'platinum'));
  end if;
end $$;

create index if not exists orders_customer_rewards_idx
  on public.orders (tenant_id, customer_account_id, created_at)
  where customer_account_id is not null;

comment on column public.tenant_settings.rewards_enabled is 'Enables the Silver/Gold/Platinum rewards programme for signed-in storefront customers.';
comment on column public.orders.reward_tier is 'Reward tier applied to this order, if the customer was signed in and the programme was enabled.';
comment on column public.orders.reward_discount_amount is 'Tier reward discount deducted from the order subtotal before future discount-code logic.';
