-- Orduva Ver-0.182 — Referral tracking foundation
-- Run in Supabase SQL Editor before deploying Ver-0.182.
-- Creates generic referral tables ready for tenant referrals now and public affiliates later.

create table if not exists public.referral_sources (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null unique,
  referrer_type text not null default 'tenant',
  referrer_tenant_id uuid references public.tenants(id) on delete set null,
  affiliate_id uuid,
  display_name text,
  status text not null default 'active',
  reward_rate_percent numeric(5,2) not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint referral_sources_referrer_type_check check (referrer_type in ('tenant', 'public_affiliate', 'campaign', 'owner_manual')),
  constraint referral_sources_status_check check (status in ('active', 'paused', 'cancelled'))
);

create table if not exists public.referral_signups (
  id uuid primary key default gen_random_uuid(),
  referral_source_id uuid references public.referral_sources(id) on delete set null,
  referred_tenant_id uuid references public.tenants(id) on delete set null,
  referral_code text,
  ref_tenant_slug text,
  ref_source text,
  landing_url text,
  status text not null default 'trial',
  reward_rate_percent numeric(5,2) not null default 15,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint referral_signups_status_check check (status in ('trial', 'converted', 'active_reward', 'cancelled', 'unmatched'))
);

create unique index if not exists referral_signups_referred_tenant_id_unique
  on public.referral_signups (referred_tenant_id);

create index if not exists referral_sources_referrer_tenant_id_idx on public.referral_sources (referrer_tenant_id);
create index if not exists referral_sources_referral_code_idx on public.referral_sources (referral_code);
create index if not exists referral_signups_referral_source_id_idx on public.referral_signups (referral_source_id);
create index if not exists referral_signups_referred_tenant_id_idx on public.referral_signups (referred_tenant_id);
create index if not exists referral_signups_ref_tenant_slug_idx on public.referral_signups (ref_tenant_slug);
create index if not exists referral_signups_status_idx on public.referral_signups (status);

alter table public.referral_sources enable row level security;
alter table public.referral_signups enable row level security;

-- Intentionally no anon/authenticated policies.
-- These tables are owner/platform records and should be accessed only by trusted server-side routes using the Supabase service role key.

comment on table public.referral_sources is 'Referral source records for tenant referrals, future public affiliates, owner manual referrals, and campaigns.';
comment on table public.referral_signups is 'Captured store signups attributed to a referral source. Reward calculation comes in a later patch.';
