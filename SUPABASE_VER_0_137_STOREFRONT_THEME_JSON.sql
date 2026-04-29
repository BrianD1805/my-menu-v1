-- Orduva Ver-0.137 — Advanced storefront theme editor storage
-- Run once in Supabase SQL editor before saving advanced theme settings.

alter table public.tenant_settings
add column if not exists storefront_theme_json jsonb;
