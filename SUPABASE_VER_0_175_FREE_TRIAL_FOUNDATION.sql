-- Orduva Ver-0.175 — Free trial foundation
-- Adds 7-day trial/subscription foundation fields to public.tenants.
-- Run this in Supabase SQL Editor before deploying Ver-0.175.

alter table public.tenants add column if not exists trial_status text;
alter table public.tenants add column if not exists trial_started_at timestamptz;
alter table public.tenants add column if not exists trial_ends_at timestamptz;
alter table public.tenants add column if not exists subscription_status text;
alter table public.tenants add column if not exists plan_name text;
alter table public.tenants add column if not exists billing_provider text;
alter table public.tenants add column if not exists billing_customer_id text;
alter table public.tenants add column if not exists billing_subscription_id text;

alter table public.tenants alter column trial_status set default 'active';
alter table public.tenants alter column trial_started_at set default now();
alter table public.tenants alter column trial_ends_at set default (now() + interval '7 days');
alter table public.tenants alter column subscription_status set default 'trial';
alter table public.tenants alter column plan_name set default 'orduva_trial';

-- Normalise any older tenants that pre-date the trial columns.
update public.tenants
set
  trial_status = coalesce(nullif(trial_status, ''), 'active'),
  trial_started_at = coalesce(trial_started_at, created_at, now()),
  trial_ends_at = coalesce(trial_ends_at, coalesce(created_at, now()) + interval '7 days'),
  subscription_status = coalesce(nullif(subscription_status, ''), 'trial'),
  plan_name = coalesce(nullif(plan_name, ''), 'orduva_trial')
where
  trial_status is null
  or trial_started_at is null
  or trial_ends_at is null
  or subscription_status is null
  or plan_name is null
  or trial_status = ''
  or subscription_status = ''
  or plan_name = '';

alter table public.tenants alter column trial_status set not null;
alter table public.tenants alter column trial_started_at set not null;
alter table public.tenants alter column trial_ends_at set not null;
alter table public.tenants alter column subscription_status set not null;
alter table public.tenants alter column plan_name set not null;

-- Keep allowed states predictable for future billing work.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenants_trial_status_check'
  ) then
    alter table public.tenants
      add constraint tenants_trial_status_check
      check (trial_status in ('active', 'expired', 'converted', 'cancelled', 'not_started'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tenants_subscription_status_check'
  ) then
    alter table public.tenants
      add constraint tenants_subscription_status_check
      check (subscription_status in ('trial', 'active', 'past_due', 'cancelled', 'expired', 'none'));
  end if;
end $$;

create index if not exists tenants_trial_status_idx on public.tenants (trial_status);
create index if not exists tenants_trial_ends_at_idx on public.tenants (trial_ends_at);
create index if not exists tenants_subscription_status_idx on public.tenants (subscription_status);
