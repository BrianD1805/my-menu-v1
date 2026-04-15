-- Orduva Patch Ver-0.032
-- Enable RLS on public-facing tables so they are no longer exposed without policies.
-- Current app access uses the server-side service role client, which bypasses RLS.

alter table public.tenants enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Make the security posture explicit. Service-role access continues to work server-side,
-- while anon/authenticated roles get no direct table access until deliberate policies are added.
drop policy if exists tenants_no_direct_access on public.tenants;
create policy tenants_no_direct_access on public.tenants
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists categories_no_direct_access on public.categories;
create policy categories_no_direct_access on public.categories
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists products_no_direct_access on public.products;
create policy products_no_direct_access on public.products
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists orders_no_direct_access on public.orders;
create policy orders_no_direct_access on public.orders
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists order_items_no_direct_access on public.order_items;
create policy order_items_no_direct_access on public.order_items
  for all
  to anon, authenticated
  using (false)
  with check (false);
