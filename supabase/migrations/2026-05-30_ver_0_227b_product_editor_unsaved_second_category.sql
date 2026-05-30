-- ORDUVA Ver-0.227B — Product editor polish and second category
-- Adds an optional second category to products so one product can appear in two storefront sections.
-- This patch creates no new public table, so no new table GRANT is required.

alter table public.products
  add column if not exists secondary_category_id uuid references public.categories(id) on delete set null;

create index if not exists products_secondary_category_idx
  on public.products (tenant_id, secondary_category_id)
  where secondary_category_id is not null;
