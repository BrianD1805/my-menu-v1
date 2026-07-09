-- Orduva Ver-0.260 — Custom domain USD add-on billing and activation flow
-- Run in Supabase SQL Editor before testing Ver-0.260.
-- Adds Owner Platform pricing settings for the custom domain add-on.
-- Keeps access server-side only via service_role. Do not grant anon/authenticated access.

begin;

create table if not exists public.platform_custom_domain_addon_settings (
  id text primary key default 'default',
  currency text not null default 'USD',
  monthly_price_usd numeric(12,2) not null default 7.50,
  stripe_price_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_custom_domain_addon_settings_singleton_check check (id = 'default'),
  constraint platform_custom_domain_addon_settings_currency_check check (currency = 'USD'),
  constraint platform_custom_domain_addon_settings_price_check check (monthly_price_usd > 0)
);

insert into public.platform_custom_domain_addon_settings (id, currency, monthly_price_usd)
values ('default', 'USD', 7.50)
on conflict (id) do update
set currency = 'USD',
    monthly_price_usd = coalesce(public.platform_custom_domain_addon_settings.monthly_price_usd, 7.50),
    updated_at = now();

create or replace function public.set_platform_custom_domain_addon_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists platform_custom_domain_addon_settings_set_updated_at
on public.platform_custom_domain_addon_settings;

create trigger platform_custom_domain_addon_settings_set_updated_at
before update on public.platform_custom_domain_addon_settings
for each row
execute function public.set_platform_custom_domain_addon_settings_updated_at();

alter table public.platform_custom_domain_addon_settings enable row level security;

grant select, insert, update, delete
on public.platform_custom_domain_addon_settings
to service_role;

alter table public.tenant_custom_domains
  add column if not exists stripe_price_id text,
  add column if not exists stripe_subscription_item_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists netlify_site_id text,
  add column if not exists netlify_domain_alias_id text,
  add column if not exists disabled_at timestamptz;

update public.tenant_custom_domains
set addon_price_currency = 'USD',
    addon_price_monthly = 7.50,
    updated_at = now()
where billing_status in ('not_started', 'addon_pending', 'past_due', 'cancelled')
   or addon_price_currency is distinct from 'USD'
   or addon_price_monthly is null
   or addon_price_monthly <= 0;

alter table public.tenant_custom_domains
  drop constraint if exists tenant_custom_domains_currency_check;

alter table public.tenant_custom_domains
  add constraint tenant_custom_domains_currency_check
  check (addon_price_currency = 'USD');

comment on table public.platform_custom_domain_addon_settings is
'Owner Platform settings for the Orduva custom domain add-on. USD monthly pricing only. Server-side service_role access only.';

comment on column public.platform_custom_domain_addon_settings.monthly_price_usd is
'Current USD monthly price for the custom domain add-on shown to stores and used for new requests.';

comment on column public.platform_custom_domain_addon_settings.stripe_price_id is
'Stripe recurring Price ID used for the custom domain add-on when Stripe subscription wiring is enabled.';

commit;
