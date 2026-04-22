begin;

alter table public.customer_push_subscriptions
  add column if not exists customer_account_id uuid null references public.customer_accounts(id) on delete set null;

create index if not exists idx_customer_push_subscriptions_customer_account_id
  on public.customer_push_subscriptions (customer_account_id);

commit;
