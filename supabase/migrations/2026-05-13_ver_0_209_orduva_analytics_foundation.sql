-- Orduva Ver-0.209 — Orduva Analytics Foundation
-- Run in Supabase SQL Editor before deploying Ver-0.209.
-- Creates lightweight analytics event tracking for public pages, tenant storefronts,
-- tenant admin, owner platform and affiliate pages. This records useful business events
-- only; it does not record mouse movement, scroll depth, keystrokes or private form data.

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  scope text not null default 'unknown',
  event_type text not null,
  host text,
  page_path text,
  page_url text,
  referrer text,
  product_id text,
  product_name text,
  order_id text,
  referral_code text,
  affiliate_code text,
  anonymous_session_id text,
  device_type text,
  browser_language text,
  user_agent text,
  ip_address text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint analytics_events_scope_check check (scope in ('public_landing', 'tenant_storefront', 'tenant_admin', 'owner_platform', 'affiliate_portal', 'checkout', 'unknown')),
  constraint analytics_events_event_type_check check (event_type in ('page_view', 'storefront_visit', 'product_view', 'product_share', 'add_to_cart', 'checkout_started', 'order_created', 'order_placed', 'referral_link_click', 'affiliate_apply_click'))
);

create table if not exists public.analytics_daily_summaries (
  id uuid primary key default gen_random_uuid(),
  summary_date date not null,
  tenant_id uuid references public.tenants(id) on delete cascade,
  scope text not null default 'unknown',
  host text,
  page_path text,
  event_type text not null,
  product_id text,
  product_name text,
  event_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint analytics_daily_summaries_unique unique (summary_date, tenant_id, scope, host, page_path, event_type, product_id)
);

create index if not exists analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_tenant_created_idx on public.analytics_events (tenant_id, created_at desc);
create index if not exists analytics_events_scope_created_idx on public.analytics_events (scope, created_at desc);
create index if not exists analytics_events_event_type_created_idx on public.analytics_events (event_type, created_at desc);
create index if not exists analytics_events_host_created_idx on public.analytics_events (host, created_at desc);
create index if not exists analytics_events_product_idx on public.analytics_events (product_id, created_at desc);
create index if not exists analytics_events_referral_code_idx on public.analytics_events (referral_code, created_at desc);
create index if not exists analytics_events_affiliate_code_idx on public.analytics_events (affiliate_code, created_at desc);

create index if not exists analytics_daily_summaries_date_idx on public.analytics_daily_summaries (summary_date desc);
create index if not exists analytics_daily_summaries_tenant_date_idx on public.analytics_daily_summaries (tenant_id, summary_date desc);

alter table public.analytics_events enable row level security;
alter table public.analytics_daily_summaries enable row level security;

-- Intentionally no anon/authenticated policies.
-- Events are inserted and read through trusted server-side API routes using the service role.

comment on table public.analytics_events is 'Lightweight Orduva analytics events for public landing, tenant storefront, tenant admin, owner platform and affiliate pages.';
comment on table public.analytics_daily_summaries is 'Future compact analytics summaries so old raw events can be rolled up without keeping unnecessary event rows forever.';
comment on column public.analytics_events.scope is 'Area that generated the event: public_landing, tenant_storefront, tenant_admin, owner_platform, affiliate_portal, checkout or unknown.';
comment on column public.analytics_events.event_type is 'Lightweight event type. No noisy mouse/scroll/keystroke tracking.';
