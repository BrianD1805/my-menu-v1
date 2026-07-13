-- Orduva Ver-0.262 — Custom domain DNS / Netlify checklist tools
-- Run in Supabase SQL Editor before testing Ver-0.262.
-- Adds manual DNS, Netlify alias and SSL checklist status fields to existing custom-domain requests.
-- Existing table remains server-side only via service_role. Do not grant anon/authenticated access.

begin;

alter table public.tenant_custom_domains
  add column if not exists dns_apex_record_status text not null default 'not_started',
  add column if not exists dns_www_record_status text not null default 'not_started',
  add column if not exists netlify_alias_status text not null default 'not_started',
  add column if not exists ssl_certificate_status text not null default 'not_started';

alter table public.tenant_custom_domains
  drop constraint if exists tenant_custom_domains_dns_apex_record_status_check;

alter table public.tenant_custom_domains
  add constraint tenant_custom_domains_dns_apex_record_status_check
  check (dns_apex_record_status in ('not_started', 'not_required', 'pending', 'configured', 'verified', 'failed'));

alter table public.tenant_custom_domains
  drop constraint if exists tenant_custom_domains_dns_www_record_status_check;

alter table public.tenant_custom_domains
  add constraint tenant_custom_domains_dns_www_record_status_check
  check (dns_www_record_status in ('not_started', 'not_required', 'pending', 'configured', 'verified', 'failed'));

alter table public.tenant_custom_domains
  drop constraint if exists tenant_custom_domains_netlify_alias_status_check;

alter table public.tenant_custom_domains
  add constraint tenant_custom_domains_netlify_alias_status_check
  check (netlify_alias_status in ('not_started', 'pending', 'added', 'verified', 'failed'));

alter table public.tenant_custom_domains
  drop constraint if exists tenant_custom_domains_ssl_certificate_status_check;

alter table public.tenant_custom_domains
  add constraint tenant_custom_domains_ssl_certificate_status_check
  check (ssl_certificate_status in ('not_started', 'pending', 'issued', 'failed'));

comment on column public.tenant_custom_domains.dns_apex_record_status is
'Manual Owner Platform checklist status for the root/apex DNS record of a custom domain.';

comment on column public.tenant_custom_domains.dns_www_record_status is
'Manual Owner Platform checklist status for the www DNS record of a custom domain.';

comment on column public.tenant_custom_domains.netlify_alias_status is
'Manual Owner Platform checklist status for adding/verifying the Netlify custom domain alias.';

comment on column public.tenant_custom_domains.ssl_certificate_status is
'Manual Owner Platform checklist status for SSL/certificate readiness on the custom domain.';

commit;
