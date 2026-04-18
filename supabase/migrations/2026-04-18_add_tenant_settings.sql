create table if not exists public.tenant_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  business_display_name text,
  storefront_heading text,
  storefront_subheading text,
  admin_heading_label text,
  logo_url text,
  primary_color text,
  accent_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_settings_primary_color_hex check (primary_color is null or primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint tenant_settings_accent_color_hex check (accent_color is null or accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tenant_settings_set_updated_at on public.tenant_settings;
create trigger tenant_settings_set_updated_at
before update on public.tenant_settings
for each row
execute function public.set_updated_at();

alter table public.tenant_settings enable row level security;
