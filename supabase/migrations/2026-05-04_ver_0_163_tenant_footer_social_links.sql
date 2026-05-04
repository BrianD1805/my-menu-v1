begin;

alter table public.tenant_settings
  add column if not exists social_facebook_url text,
  add column if not exists social_instagram_url text,
  add column if not exists social_tiktok_url text,
  add column if not exists social_x_url text,
  add column if not exists social_website_url text;

commit;
