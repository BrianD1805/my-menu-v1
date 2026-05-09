-- Orduva Ver-0.191 — Stripe webhook foundation
-- Run in Supabase SQL Editor before deploying Ver-0.191.
-- This lets Stripe webhooks safely activate tenants, record subscription payments,
-- and trigger referral reward credits without processing the same Stripe event twice.

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  livemode boolean not null default false,
  status text not null default 'processing',
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  constraint stripe_webhook_events_status_check check (status in ('processing', 'processed', 'ignored', 'failed'))
);

create index if not exists stripe_webhook_events_event_type_idx on public.stripe_webhook_events (event_type);
create index if not exists stripe_webhook_events_status_idx on public.stripe_webhook_events (status);
create index if not exists stripe_webhook_events_created_at_idx on public.stripe_webhook_events (created_at);

-- Prevent the same Stripe invoice/payment reference being recorded twice.
create unique index if not exists tenant_subscription_payments_stripe_reference_unique_idx
  on public.tenant_subscription_payments (payment_source, payment_reference)
  where payment_source = 'stripe'
    and payment_reference is not null
    and payment_status <> 'void';

alter table public.stripe_webhook_events enable row level security;

-- Intentionally no anon/authenticated policies.
-- This table is only for trusted server-side Stripe webhook processing using the service role key.

comment on table public.stripe_webhook_events is 'Stripe webhook event idempotency and audit log for Orduva billing automation.';
comment on index public.tenant_subscription_payments_stripe_reference_unique_idx is 'Prevents duplicate tenant subscription payment rows for the same Stripe invoice/payment reference.';
