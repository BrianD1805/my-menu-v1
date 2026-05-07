-- Orduva Ver-0.181 — Tenant referral advert foundation
-- Adds a tenant-controlled storefront setting for the Orduva referral advert.
-- Run in Supabase SQL Editor before deploying Ver-0.181.

alter table public.tenant_settings
  add column if not exists show_orduva_referral_ad boolean not null default true;

update public.tenant_settings
set show_orduva_referral_ad = true
where show_orduva_referral_ad is null;

comment on column public.tenant_settings.show_orduva_referral_ad is
  'Controls whether the tenant storefront footer shows the Orduva referral advert. Future referral tracking can connect signups from this URL to tenant rewards.';
