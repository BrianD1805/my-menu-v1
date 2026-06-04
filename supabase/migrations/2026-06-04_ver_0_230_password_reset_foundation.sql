-- ORDUVA Ver-0.230 — Password reset foundation
-- Supports Tenant/Admin forgot password and Storefront customer forgot password.
-- Uses server-side API routes only. Do not grant anon/authenticated access.

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  account_type text not null,
  account_id uuid not null,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  request_ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'password_reset_tokens_account_type_check') then
    alter table public.password_reset_tokens
      add constraint password_reset_tokens_account_type_check
      check (account_type in ('customer', 'tenant_admin'));
  end if;
end $$;

create unique index if not exists password_reset_tokens_hash_uidx
  on public.password_reset_tokens (token_hash);

create index if not exists password_reset_tokens_account_idx
  on public.password_reset_tokens (tenant_id, account_type, account_id, created_at desc);

create index if not exists password_reset_tokens_expiry_idx
  on public.password_reset_tokens (expires_at)
  where used_at is null;

alter table public.password_reset_tokens enable row level security;

drop policy if exists "service_role_full_access_password_reset_tokens" on public.password_reset_tokens;
create policy "service_role_full_access_password_reset_tokens"
on public.password_reset_tokens
for all
to service_role
using (true)
with check (true);

grant select, insert, update, delete
on public.password_reset_tokens
to service_role;
