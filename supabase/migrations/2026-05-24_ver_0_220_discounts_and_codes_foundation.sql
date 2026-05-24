-- Orduva Ver-0.220 — Discounts & discount codes foundation
-- Run in Supabase SQL Editor before deploying Ver-0.220.
-- Adds tenant-controlled product/combo/site-wide discount rules and order-level discount audit fields.

alter table public.tenant_settings
  add column if not exists discounts_enabled boolean not null default false,
  add column if not exists discount_popup_enabled boolean not null default false,
  add column if not exists discount_popup_title text not null default 'Today''s offers',
  add column if not exists discount_popup_message text not null default 'Tap an offer at checkout to apply it to your order.',
  add column if not exists discount_rules jsonb not null default '[]'::jsonb;

alter table public.orders
  add column if not exists discount_rule_id text,
  add column if not exists discount_code text,
  add column if not exists discount_name text,
  add column if not exists discount_scope text,
  add column if not exists discount_type text,
  add column if not exists discount_value numeric(10,2) not null default 0,
  add column if not exists discount_base_amount numeric(10,2) not null default 0,
  add column if not exists discount_amount numeric(10,2) not null default 0,
  add column if not exists discount_allow_with_rewards boolean not null default true,
  add column if not exists discount_only_this_discount boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tenant_settings_discount_rules_array_check'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_discount_rules_array_check
      check (jsonb_typeof(discount_rules) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_discount_scope_check'
  ) then
    alter table public.orders
      add constraint orders_discount_scope_check
      check (discount_scope is null or discount_scope in ('sitewide', 'product', 'combo'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_discount_type_check'
  ) then
    alter table public.orders
      add constraint orders_discount_type_check
      check (discount_type is null or discount_type in ('percentage', 'fixed'));
  end if;
end $$;

create index if not exists orders_discount_code_idx
  on public.orders (tenant_id, discount_code, created_at)
  where discount_code is not null;

comment on column public.tenant_settings.discount_rules is 'JSON discount rules for site-wide, product-specific and up-to-three-product combo discounts.';
comment on column public.orders.discount_amount is 'Discount code / promotional offer amount deducted from the order total after any eligible rewards discount.';
