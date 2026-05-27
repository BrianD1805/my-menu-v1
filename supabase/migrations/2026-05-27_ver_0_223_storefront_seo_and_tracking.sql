alter table public.tenant_settings
  add column if not exists seo_page_name text,
  add column if not exists seo_meta_description text,
  add column if not exists seo_keywords text,
  add column if not exists seo_canonical_url text,
  add column if not exists seo_structured_data_enabled boolean not null default true,
  add column if not exists google_tracking_id text,
  add column if not exists google_tag_manager_id text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_settings_seo_page_name_length_check') then
    alter table public.tenant_settings add constraint tenant_settings_seo_page_name_length_check check (seo_page_name is null or char_length(seo_page_name) <= 55);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'tenant_settings_seo_meta_description_length_check') then
    alter table public.tenant_settings add constraint tenant_settings_seo_meta_description_length_check check (seo_meta_description is null or char_length(seo_meta_description) <= 160);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'tenant_settings_google_tag_manager_id_check') then
    alter table public.tenant_settings add constraint tenant_settings_google_tag_manager_id_check check (google_tag_manager_id is null or google_tag_manager_id ~ '^GTM-[A-Z0-9]{4,20}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'tenant_settings_google_tracking_id_check') then
    alter table public.tenant_settings add constraint tenant_settings_google_tracking_id_check check (google_tracking_id is null or google_tracking_id ~ '^(G|UA|AW)-[A-Z0-9-]{4,40}$');
  end if;
end $$;
