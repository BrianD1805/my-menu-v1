begin;

create extension if not exists pgcrypto;

create table if not exists public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text null,
  phone text null,
  email text not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_customer_accounts_tenant_email
  on public.customer_accounts (tenant_id, email);

create index if not exists idx_customer_accounts_tenant_phone
  on public.customer_accounts (tenant_id, phone);

create or replace function public.set_updated_at_customer_accounts()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_customer_accounts on public.customer_accounts;

create trigger trg_set_updated_at_customer_accounts
before update on public.customer_accounts
for each row
execute function public.set_updated_at_customer_accounts();

alter table public.customer_accounts enable row level security;

drop policy if exists "service_role_full_access_customer_accounts" on public.customer_accounts;
create policy "service_role_full_access_customer_accounts"
on public.customer_accounts
for all
to service_role
using (true)
with check (true);

commit;
