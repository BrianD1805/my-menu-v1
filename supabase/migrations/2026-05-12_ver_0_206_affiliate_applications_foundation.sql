-- Orduva Ver-0.206 — Approved affiliate application foundation
-- Run in Supabase SQL Editor before deploying Ver-0.206.
-- Adds public affiliate applications, approved affiliate partners, and keeps the affiliate
-- reward stream separate from tenant referral links.

create table if not exists public.affiliate_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_name text not null,
  email text not null,
  phone text,
  country text,
  website_url text,
  audience_notes text,
  promotion_plan text,
  ref_tenant_slug text,
  referring_tenant_id uuid references public.tenants(id) on delete set null,
  status text not null default 'pending',
  owner_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint affiliate_applications_status_check check (status in ('pending', 'approved', 'declined', 'cancelled'))
);

create table if not exists public.affiliate_partners (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.affiliate_applications(id) on delete set null,
  display_name text not null,
  email text not null,
  phone text,
  country text,
  website_url text,
  tracking_code text not null unique,
  access_key text not null,
  status text not null default 'active',
  affiliate_reward_rate_percent numeric(5,2) not null default 10,
  referring_tenant_id uuid references public.tenants(id) on delete set null,
  referring_tenant_slug text,
  tenant_reward_rate_percent numeric(5,2) not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint affiliate_partners_status_check check (status in ('active', 'paused', 'cancelled')),
  constraint affiliate_partners_affiliate_rate_check check (affiliate_reward_rate_percent >= 0 and affiliate_reward_rate_percent <= 100),
  constraint affiliate_partners_tenant_rate_check check (tenant_reward_rate_percent >= 0 and tenant_reward_rate_percent <= 100)
);

alter table public.referral_rewards
  add column if not exists affiliate_id uuid references public.affiliate_partners(id) on delete set null,
  add column if not exists referrer_type text,
  add column if not exists secondary_referrer_tenant_id uuid references public.tenants(id) on delete set null,
  add column if not exists secondary_reward_rate_percent numeric(5,2) not null default 0,
  add column if not exists secondary_estimated_monthly_reward numeric(12,2) not null default 0;

alter table public.referral_reward_credits
  add column if not exists affiliate_id uuid references public.affiliate_partners(id) on delete set null,
  add column if not exists secondary_referrer_tenant_id uuid references public.tenants(id) on delete set null,
  add column if not exists secondary_reward_rate_percent numeric(5,2) not null default 0,
  add column if not exists secondary_reward_amount numeric(12,2) not null default 0;

create index if not exists affiliate_applications_status_idx on public.affiliate_applications (status);
create index if not exists affiliate_applications_email_idx on public.affiliate_applications (email);
create index if not exists affiliate_applications_referring_tenant_id_idx on public.affiliate_applications (referring_tenant_id);
create index if not exists affiliate_partners_tracking_code_idx on public.affiliate_partners (tracking_code);
create index if not exists affiliate_partners_email_idx on public.affiliate_partners (email);
create index if not exists affiliate_partners_status_idx on public.affiliate_partners (status);
create index if not exists affiliate_partners_referring_tenant_id_idx on public.affiliate_partners (referring_tenant_id);
create index if not exists referral_rewards_affiliate_id_idx on public.referral_rewards (affiliate_id);
create index if not exists referral_rewards_secondary_referrer_tenant_id_idx on public.referral_rewards (secondary_referrer_tenant_id);
create index if not exists referral_reward_credits_affiliate_id_idx on public.referral_reward_credits (affiliate_id);

alter table public.affiliate_applications enable row level security;
alter table public.affiliate_partners enable row level security;

-- Intentionally no anon/authenticated policies.
-- Public applications and affiliate dashboards are handled through trusted server-side routes.

comment on table public.affiliate_applications is 'Public Orduva affiliate applications. Owner approval creates an affiliate partner and affiliate referral source.';
comment on table public.affiliate_partners is 'Approved non-tenant affiliates with their own share link, dashboard login key and separate commission stream.';
comment on column public.affiliate_partners.affiliate_reward_rate_percent is 'Default approved affiliate commission. Ver-0.206 uses 10 percent.';
comment on column public.affiliate_partners.tenant_reward_rate_percent is 'Default referring tenant commission when the affiliate was introduced from a tenant storefront. Ver-0.206 uses 5 percent.';
