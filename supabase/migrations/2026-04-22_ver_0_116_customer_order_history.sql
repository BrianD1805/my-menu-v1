begin;

alter table public.orders
  add column if not exists customer_account_id uuid null references public.customer_accounts(id) on delete set null;

create index if not exists idx_orders_customer_account_id
  on public.orders (customer_account_id);

commit;
