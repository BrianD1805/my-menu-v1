alter table public.tenant_settings
  add column if not exists receipt_document_name text not null default 'Receipt',
  add column if not exists receipt_tax_label text not null default 'VAT',
  add column if not exists receipt_tax_number text,
  add column if not exists receipt_extra_field_1_enabled boolean not null default false,
  add column if not exists receipt_extra_field_1_label text,
  add column if not exists receipt_extra_field_1_value text,
  add column if not exists receipt_extra_field_2_enabled boolean not null default false,
  add column if not exists receipt_extra_field_2_label text,
  add column if not exists receipt_extra_field_2_value text,
  add column if not exists receipt_footer_message text,
  add column if not exists receipt_brand_image_mode text not null default 'logo';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_settings_receipt_tax_label_check') then
    alter table public.tenant_settings add constraint tenant_settings_receipt_tax_label_check check (receipt_tax_label in ('VAT', 'GST'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'tenant_settings_receipt_brand_image_mode_check') then
    alter table public.tenant_settings add constraint tenant_settings_receipt_brand_image_mode_check check (receipt_brand_image_mode in ('logo', 'favicon'));
  end if;
end $$;
