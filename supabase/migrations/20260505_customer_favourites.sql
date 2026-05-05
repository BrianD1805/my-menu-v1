begin;

create table if not exists public.customer_favourites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tenant_id, customer_account_id, product_id)
);

create index if not exists customer_favourites_tenant_customer_idx
  on public.customer_favourites (tenant_id, customer_account_id, created_at desc);

create index if not exists customer_favourites_product_idx
  on public.customer_favourites (product_id);

commit;
