-- Orduva Ver-0.255 — Product variant requirement flag
-- Run in Supabase SQL Editor before testing/deploying Ver-0.255.
-- Adds a product-level control so a display/base product can require customers to choose a variant before adding to basket.

begin;

alter table public.products
  add column if not exists product_requires_variant boolean not null default false;

comment on column public.products.product_requires_variant is
'When true, the base product is display-only on the storefront and customers must select an active variant before adding to basket.';

commit;
