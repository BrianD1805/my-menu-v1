-- Orduva Ver-0.237 — Tenant account and legal page foundation
-- Run in Supabase SQL Editor before testing the new Tenant Admin Account page and storefront legal pages.

alter table public.tenant_settings
  add column if not exists account_business_legal_name text,
  add column if not exists account_contact_name text,
  add column if not exists account_phone text,
  add column if not exists account_email text,
  add column if not exists account_address_line_1 text,
  add column if not exists account_address_line_2 text,
  add column if not exists account_city text,
  add column if not exists account_region text,
  add column if not exists account_postcode text,
  add column if not exists account_country text,
  add column if not exists ship_from_name text,
  add column if not exists ship_from_address_line_1 text,
  add column if not exists ship_from_address_line_2 text,
  add column if not exists ship_from_city text,
  add column if not exists ship_from_region text,
  add column if not exists ship_from_postcode text,
  add column if not exists ship_from_country text,
  add column if not exists privacy_policy_title text,
  add column if not exists privacy_policy_body text,
  add column if not exists privacy_policy_show_on_storefront boolean not null default true,
  add column if not exists terms_of_service_title text,
  add column if not exists terms_of_service_body text,
  add column if not exists terms_of_service_show_on_storefront boolean not null default true;

update public.tenant_settings
set
  privacy_policy_title = coalesce(privacy_policy_title, 'Privacy Policy'),
  terms_of_service_title = coalesce(terms_of_service_title, 'Terms of Service'),
  account_email = coalesce(account_email, contact_email),
  account_phone = coalesce(account_phone, contact_phone),
  account_address_line_1 = coalesce(account_address_line_1, contact_address),
  ship_from_name = coalesce(ship_from_name, business_display_name),
  ship_from_address_line_1 = coalesce(ship_from_address_line_1, contact_address)
where tenant_id is not null;

grant select, insert, update, delete
on public.tenant_settings
to service_role;
