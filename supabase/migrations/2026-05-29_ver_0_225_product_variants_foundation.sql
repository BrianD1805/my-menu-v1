-- ORDUVA Ver-0.225 — Product variants foundation
-- Adds product-level variant options for sizes, weights, colours, flavours, etc.
-- No new public tables are created in this patch, so no new table GRANT is required.

alter table public.products
  add column if not exists variants_enabled boolean not null default false,
  add column if not exists variant_label text not null default 'Choose an option',
  add column if not exists product_variants jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_product_variants_json_check') then
    alter table public.products
      add constraint products_product_variants_json_check
      check (jsonb_typeof(product_variants) = 'array');
  end if;
end $$;

alter table public.order_items
  add column if not exists variant_id text,
  add column if not exists variant_label text,
  add column if not exists variant_name text,
  add column if not exists variant_price_delta numeric(10,2) not null default 0;

create index if not exists order_items_variant_idx
  on public.order_items (product_id, variant_id)
  where variant_id is not null;
