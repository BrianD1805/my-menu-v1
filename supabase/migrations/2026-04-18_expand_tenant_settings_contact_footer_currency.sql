alter table public.tenant_settings
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists contact_whatsapp text,
  add column if not exists contact_address text,
  add column if not exists footer_blurb text,
  add column if not exists footer_notice text,
  add column if not exists currency_name text,
  add column if not exists currency_code text,
  add column if not exists currency_symbol text;

alter table public.tenant_settings
  drop constraint if exists tenant_settings_currency_code_format;

alter table public.tenant_settings
  add constraint tenant_settings_currency_code_format
  check (currency_code is null or currency_code ~ '^[A-Z]{3}$');
