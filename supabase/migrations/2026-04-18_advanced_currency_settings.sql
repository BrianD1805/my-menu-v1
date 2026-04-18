alter table public.tenant_settings
  add column if not exists currency_display_mode text,
  add column if not exists currency_symbol_position text,
  add column if not exists currency_decimal_places integer,
  add column if not exists currency_use_thousands_separator boolean,
  add column if not exists currency_decimal_separator text,
  add column if not exists currency_thousands_separator text,
  add column if not exists currency_suffix text;

alter table public.tenant_settings
  drop constraint if exists tenant_settings_currency_display_mode_check,
  drop constraint if exists tenant_settings_currency_symbol_position_check,
  drop constraint if exists tenant_settings_currency_decimal_places_check,
  drop constraint if exists tenant_settings_currency_decimal_separator_check,
  drop constraint if exists tenant_settings_currency_thousands_separator_check;

alter table public.tenant_settings
  add constraint tenant_settings_currency_display_mode_check
    check (currency_display_mode is null or currency_display_mode in ('symbol', 'code', 'code_symbol', 'symbol_code', 'none')),
  add constraint tenant_settings_currency_symbol_position_check
    check (currency_symbol_position is null or currency_symbol_position in ('before', 'after')),
  add constraint tenant_settings_currency_decimal_places_check
    check (currency_decimal_places is null or (currency_decimal_places between 0 and 4)),
  add constraint tenant_settings_currency_decimal_separator_check
    check (currency_decimal_separator is null or char_length(currency_decimal_separator) = 1),
  add constraint tenant_settings_currency_thousands_separator_check
    check (currency_thousands_separator is null or char_length(currency_thousands_separator) = 1);
