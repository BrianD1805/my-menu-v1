begin;

alter table public.products
  add column if not exists stock_enabled boolean not null default false,
  add column if not exists stock_quantity integer not null default 0,
  add column if not exists low_stock_threshold integer not null default 5;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_stock_quantity_non_negative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_stock_quantity_non_negative
      check (stock_quantity >= 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_low_stock_threshold_non_negative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_low_stock_threshold_non_negative
      check (low_stock_threshold >= 0);
  end if;
end $$;

create index if not exists products_tenant_stock_idx
  on public.products (tenant_id, stock_enabled, stock_quantity);

commit;
