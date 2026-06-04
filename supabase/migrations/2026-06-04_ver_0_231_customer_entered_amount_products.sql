-- ORDUVA Ver-0.231 — Customer-entered amount products
-- Supports products such as Pay your invoice / Pay deposit / Pay balance.
-- No browser/client grants are added. Server-side API routes use service_role.

alter table public.products
  add column if not exists product_type text not null default 'standard',
  add column if not exists custom_amount_enabled boolean not null default false,
  add column if not exists custom_amount_label text not null default 'Amount to pay',
  add column if not exists custom_amount_reference_label text not null default 'Invoice number',
  add column if not exists custom_amount_reference_required boolean not null default true,
  add column if not exists custom_amount_min numeric(10,2) not null default 1,
  add column if not exists custom_amount_max numeric(10,2),
  add column if not exists custom_amount_help_text text,
  add column if not exists custom_amount_disable_rewards boolean not null default true,
  add column if not exists custom_amount_disable_discounts boolean not null default true;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_product_type_check') then
    alter table public.products
      add constraint products_product_type_check
      check (product_type in ('standard', 'customer_amount'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'products_custom_amount_min_check') then
    alter table public.products
      add constraint products_custom_amount_min_check
      check (custom_amount_min >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'products_custom_amount_max_check') then
    alter table public.products
      add constraint products_custom_amount_max_check
      check (custom_amount_max is null or custom_amount_max >= custom_amount_min);
  end if;
end $$;

alter table public.order_items
  add column if not exists customer_entered_amount numeric(10,2),
  add column if not exists customer_reference text,
  add column if not exists customer_note text;

create index if not exists products_product_type_idx
  on public.products (tenant_id, product_type)
  where product_type = 'customer_amount';

create index if not exists order_items_customer_reference_idx
  on public.order_items (customer_reference)
  where customer_reference is not null;
