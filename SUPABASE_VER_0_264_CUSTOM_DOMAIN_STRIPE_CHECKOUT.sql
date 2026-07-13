-- Orduva Ver-0.264 — Stripe custom domain add-on checkout
-- Run in Supabase SQL Editor before testing Ver-0.264.
-- Adds Stripe subscription tracking fields for the USD custom-domain add-on.
-- Existing access remains server-side only through service_role. Do not grant anon/authenticated access.

begin;

alter table public.tenant_custom_domains
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_last_event_id text,
  add column if not exists stripe_billing_checked_at timestamptz;

create index if not exists tenant_custom_domains_stripe_subscription_id_idx
  on public.tenant_custom_domains (stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists tenant_custom_domains_stripe_customer_id_idx
  on public.tenant_custom_domains (stripe_customer_id)
  where stripe_customer_id is not null;

comment on column public.tenant_custom_domains.stripe_subscription_id is
'Stripe subscription id for the USD monthly custom-domain add-on.';

comment on column public.tenant_custom_domains.stripe_customer_id is
'Stripe customer id returned by the custom-domain add-on Checkout Session/webhook.';

comment on column public.tenant_custom_domains.stripe_last_event_id is
'Last Stripe webhook event id that updated this custom-domain add-on billing state.';

comment on column public.tenant_custom_domains.stripe_billing_checked_at is
'Last time Orduva verified or updated this custom-domain add-on billing state from Stripe.';

commit;
