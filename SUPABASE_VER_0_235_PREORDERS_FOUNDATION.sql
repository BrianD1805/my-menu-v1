-- Orduva Ver-0.235 — Pre-orders foundation
-- Run in Supabase SQL Editor before deploying Ver-0.235.
-- Adds tenant-configurable pre-order deposits, pre-order product flags and order balance tracking.

alter table public.tenant_settings
  add column if not exists preorders_enabled boolean not null default true,
  add column if not exists preorder_deposit_percent numeric(5,2) not null default 25;

alter table public.products
  add column if not exists preorder_enabled boolean not null default false,
  add column if not exists preorder_when_out_of_stock boolean not null default false;

alter table public.orders
  add column if not exists order_flow text not null default 'standard',
  add column if not exists preorder_status text,
  add column if not exists preorder_deposit_percent numeric(5,2),
  add column if not exists preorder_deposit_amount numeric(10,2) not null default 0,
  add column if not exists preorder_balance_amount numeric(10,2) not null default 0,
  add column if not exists preorder_balance_payment_status text not null default 'not_applicable',
  add column if not exists preorder_balance_requested_at timestamptz,
  add column if not exists preorder_balance_paid_at timestamptz;

alter table public.order_items
  add column if not exists is_preorder boolean not null default false,
  add column if not exists preorder_deposit_amount numeric(10,2) not null default 0,
  add column if not exists preorder_balance_amount numeric(10,2) not null default 0;

alter table public.storefront_payment_intents
  add column if not exists preorder_payment_stage text not null default 'full_payment',
  add column if not exists preorder_order_id uuid references public.orders(id) on delete set null;

create index if not exists orders_tenant_preorder_idx
  on public.orders (tenant_id, order_flow, preorder_status, created_at);
create index if not exists order_items_preorder_idx
  on public.order_items (order_id, is_preorder);
create index if not exists products_preorder_idx
  on public.products (tenant_id, preorder_enabled, preorder_when_out_of_stock);

-- Create a standard Pre-Orders category for every existing tenant without duplicating it.
insert into public.categories (tenant_id, name, sort_order)
select t.id, 'Pre-Orders', 999
from public.tenants t
where not exists (
  select 1
  from public.categories c
  where c.tenant_id = t.id
    and lower(trim(c.name)) = 'pre-orders'
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tenant_settings_preorder_deposit_percent_check') then
    alter table public.tenant_settings
      add constraint tenant_settings_preorder_deposit_percent_check
      check (preorder_deposit_percent between 1 and 95);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_order_flow_check') then
    alter table public.orders
      add constraint orders_order_flow_check
      check (order_flow in ('standard', 'preorder', 'mixed'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_preorder_status_check') then
    alter table public.orders
      add constraint orders_preorder_status_check
      check (preorder_status is null or preorder_status in ('deposit_paid', 'awaiting_stock', 'stock_arrived', 'balance_requested', 'balance_paid', 'ready_for_dispatch', 'completed', 'cancelled'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_preorder_balance_payment_status_check') then
    alter table public.orders
      add constraint orders_preorder_balance_payment_status_check
      check (preorder_balance_payment_status in ('not_applicable', 'pending', 'requested', 'paid', 'cancelled'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'storefront_payment_intents_preorder_payment_stage_check') then
    alter table public.storefront_payment_intents
      add constraint storefront_payment_intents_preorder_payment_stage_check
      check (preorder_payment_stage in ('full_payment', 'deposit', 'balance'));
  end if;
end $$;

comment on column public.tenant_settings.preorder_deposit_percent is 'Default customer deposit percentage for pre-order checkout. Ver-0.235 default is 25%. Change in Tenant Admin Settings.';
comment on column public.products.preorder_enabled is 'Product is deliberately sold as a pre-order. Deposit is taken at checkout and stock is only deducted when the balance is paid.';
comment on column public.products.preorder_when_out_of_stock is 'Standard product may become pre-orderable when tracked stock reaches zero or below.';
comment on column public.orders.preorder_balance_amount is 'Remaining pre-order balance to collect after stock arrives.';
