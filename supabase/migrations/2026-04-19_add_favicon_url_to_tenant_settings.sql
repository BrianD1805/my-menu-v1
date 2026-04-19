alter table public.tenant_settings
  add column if not exists favicon_url text;
