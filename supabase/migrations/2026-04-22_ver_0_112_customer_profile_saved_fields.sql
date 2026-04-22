begin;

alter table public.customer_accounts
  add column if not exists address_line_1 text null,
  add column if not exists address_line_2 text null,
  add column if not exists city text null,
  add column if not exists postcode text null;

commit;
