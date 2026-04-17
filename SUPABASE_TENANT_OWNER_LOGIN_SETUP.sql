-- Orduva Phase 2 owner login foundation setup
-- Run this once in Supabase SQL editor before using Ver-0.062.

create extension if not exists pgcrypto;

create table if not exists public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  full_name text null,
  role text not null default 'owner',
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_users_tenant_email_unique unique (tenant_id, email)
);

create index if not exists tenant_users_tenant_id_idx on public.tenant_users(tenant_id);
create index if not exists tenant_users_email_idx on public.tenant_users(email);
