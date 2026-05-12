-- Orduva Ver-0.206A — Affiliate payout currency and target earning region fields
-- Run this in Supabase SQL Editor before deploying Ver-0.206A.

alter table public.affiliate_applications
  add column if not exists payout_currency_code text,
  add column if not exists earning_region text,
  add column if not exists earning_region_other text;

alter table public.affiliate_partners
  add column if not exists payout_currency_code text,
  add column if not exists earning_region text,
  add column if not exists earning_region_other text;

update public.affiliate_applications
set payout_currency_code = case
  when upper(coalesce(country, '')) in ('ZAR','KES','GBP','USD','EUR','AUD','NZD') then upper(country)
  when lower(coalesce(country, '')) like '%kenya%' then 'KES'
  when lower(coalesce(country, '')) like '%south africa%' then 'ZAR'
  when lower(coalesce(country, '')) like '%united kingdom%' or lower(coalesce(country, '')) like '%britain%' or lower(coalesce(country, '')) like '%uk%' then 'GBP'
  when lower(coalesce(country, '')) like '%united states%' or lower(coalesce(country, '')) like '%america%' or lower(coalesce(country, '')) like '%usa%' then 'USD'
  when lower(coalesce(country, '')) like '%euro%' or lower(coalesce(country, '')) like '%europe%' then 'EUR'
  when lower(coalesce(country, '')) like '%australia%' then 'AUD'
  when lower(coalesce(country, '')) like '%new zealand%' then 'NZD'
  else 'GBP'
end
where payout_currency_code is null;

update public.affiliate_partners
set payout_currency_code = case
  when upper(coalesce(country, '')) in ('ZAR','KES','GBP','USD','EUR','AUD','NZD') then upper(country)
  when lower(coalesce(country, '')) like '%kenya%' then 'KES'
  when lower(coalesce(country, '')) like '%south africa%' then 'ZAR'
  when lower(coalesce(country, '')) like '%united kingdom%' or lower(coalesce(country, '')) like '%britain%' or lower(coalesce(country, '')) like '%uk%' then 'GBP'
  when lower(coalesce(country, '')) like '%united states%' or lower(coalesce(country, '')) like '%america%' or lower(coalesce(country, '')) like '%usa%' then 'USD'
  when lower(coalesce(country, '')) like '%euro%' or lower(coalesce(country, '')) like '%europe%' then 'EUR'
  when lower(coalesce(country, '')) like '%australia%' then 'AUD'
  when lower(coalesce(country, '')) like '%new zealand%' then 'NZD'
  else 'GBP'
end
where payout_currency_code is null;

alter table public.affiliate_applications
  alter column payout_currency_code set default 'GBP';

alter table public.affiliate_partners
  alter column payout_currency_code set default 'GBP';

create index if not exists affiliate_applications_payout_currency_idx on public.affiliate_applications (payout_currency_code);
create index if not exists affiliate_partners_payout_currency_idx on public.affiliate_partners (payout_currency_code);

comment on column public.affiliate_applications.payout_currency_code is 'Affiliate selected payout currency from application form. Ver-0.206A supports ZAR, KES, GBP, USD, EUR, AUD and NZD.';
comment on column public.affiliate_partners.payout_currency_code is 'Approved affiliate payout currency copied from application. Commission conversion is manual until automatic FX is added.';
comment on column public.affiliate_applications.earning_region is 'Country/region where applicant intends to earn referrals.';
comment on column public.affiliate_partners.earning_region is 'Country/region where approved affiliate intends to earn referrals.';
