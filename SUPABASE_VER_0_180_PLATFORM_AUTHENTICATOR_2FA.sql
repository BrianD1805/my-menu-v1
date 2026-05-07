-- Orduva Ver-0.180 — Platform authenticator 2FA foundation
-- Run in Supabase SQL Editor before deploying Ver-0.180.
-- This adds owner-level authenticator security for /platform pages.

create table if not exists public.platform_security (
  id text primary key default 'owner',
  totp_enabled boolean not null default false,
  totp_secret text,
  totp_confirmed_at timestamptz,
  totp_last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.platform_security (id, totp_enabled)
values ('owner', false)
on conflict (id) do nothing;

create table if not exists public.platform_security_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists platform_security_sessions_token_hash_idx
  on public.platform_security_sessions (token_hash);

create index if not exists platform_security_sessions_expires_at_idx
  on public.platform_security_sessions (expires_at);

-- Optional housekeeping, safe to run occasionally:
-- delete from public.platform_security_sessions where expires_at < now() - interval '7 days';

-- Emergency owner recovery if your authenticator device is lost:
-- update public.platform_security
-- set totp_enabled = false,
--     totp_secret = null,
--     totp_confirmed_at = null,
--     totp_last_verified_at = null,
--     updated_at = now()
-- where id = 'owner';
