-- Orduva Ver-0.259 — Custom domain add-on foundation
-- Run in Supabase SQL Editor before testing Ver-0.259.
-- Creates the manual custom-domain request/approval table for the $5/month add-on.
-- Access is server-side only via service_role; do not grant anon/authenticated access.

begin;

create table if not exists public.tenant_custom_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  domain_name text not null,
  normalized_domain text not null,
  status text not null default 'requested',
  billing_status text not null default 'addon_pending',
  addon_price_currency text not null default 'USD',
  addon_price_monthly numeric(12,2) not null default 5,
  billing_interval text not null default 'monthly',
  requested_by_email text,
  tenant_notes text,
  owner_notes text,
  dns_target text not null default 'orduva.com',
  verification_token text,
  stripe_price_id text,
  stripe_subscription_item_id text,
  stripe_checkout_session_id text,
  netlify_site_id text,
  netlify_domain_alias_id text,
  approved_at timestamptz,
  activated_at timestamptz,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_custom_domains_status_check check (status in ('requested', 'billing_pending', 'pending_dns', 'pending_owner_review', 'approved', 'active', 'rejected', 'disabled')),
  constraint tenant_custom_domains_billing_status_check check (billing_status in ('not_started', 'addon_pending', 'active', 'past_due', 'cancelled', 'manual')),
  constraint tenant_custom_domains_billing_interval_check check (billing_interval in ('monthly')),
  constraint tenant_custom_domains_currency_check check (addon_price_currency in ('USD', 'ZAR', 'KES', 'GBP', 'EUR'))
);

create unique index if not exists tenant_custom_domains_normalized_domain_uidx
  on public.tenant_custom_domains (normalized_domain);

create index if not exists tenant_custom_domains_tenant_idx
  on public.tenant_custom_domains (tenant_id, status, billing_status);

create index if not exists tenant_custom_domains_status_idx
  on public.tenant_custom_domains (status, billing_status, created_at desc);

create or replace function public.set_tenant_custom_domains_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tenant_custom_domains_set_updated_at
on public.tenant_custom_domains;

create trigger tenant_custom_domains_set_updated_at
before update on public.tenant_custom_domains
for each row
execute function public.set_tenant_custom_domains_updated_at();

alter table public.tenant_custom_domains enable row level security;

grant select, insert, update, delete
on public.tenant_custom_domains
to service_role;

comment on table public.tenant_custom_domains is
'Tenant custom domain add-on requests, billing status, DNS verification notes and owner approval state. Server-side service_role access only.';

comment on column public.tenant_custom_domains.billing_status is
'Tracks the custom domain add-on subscription/billing state separately from DNS and routing approval.';

comment on column public.tenant_custom_domains.normalized_domain is
'Lowercase canonical domain without protocol, path, port or leading www, used to prevent duplicate tenant claims.';

commit;
