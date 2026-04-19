alter table public.tenant_settings
  add column if not exists background_tint text,
  add column if not exists border_color text,
  add column if not exists text_color text;

alter table public.tenant_settings
  drop constraint if exists tenant_settings_background_tint_hex,
  drop constraint if exists tenant_settings_border_color_hex,
  drop constraint if exists tenant_settings_text_color_hex;

alter table public.tenant_settings
  add constraint tenant_settings_background_tint_hex
    check (background_tint is null or background_tint ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint tenant_settings_border_color_hex
    check (border_color is null or border_color ~ '^#[0-9A-Fa-f]{6}$'),
  add constraint tenant_settings_text_color_hex
    check (text_color is null or text_color ~ '^#[0-9A-Fa-f]{6}$');
