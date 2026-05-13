-- Orduva Ver-0.212 — Yoco Storefront Checkout Foundation
-- Run in Supabase SQL Editor before deploying Ver-0.212.
-- Adds Yoco checkout references to the existing storefront_payment_intents table.
-- The actual order is created only after Yoco payment confirmation, matching the Stripe order-after-payment pattern.

alter table public.storefront_payment_intents
  add column if not exists yoco_checkout_id text,
  add column if not exists yoco_payment_id text;

create unique index if not exists storefront_payment_intents_yoco_checkout_uidx
  on public.storefront_payment_intents (yoco_checkout_id)
  where yoco_checkout_id is not null;

create index if not exists storefront_payment_intents_yoco_payment_idx
  on public.storefront_payment_intents (yoco_payment_id)
  where yoco_payment_id is not null;

comment on column public.storefront_payment_intents.yoco_checkout_id is 'Yoco hosted checkout ID returned by the Checkout API for tenant storefront payments.';
comment on column public.storefront_payment_intents.yoco_payment_id is 'Yoco payment ID/reference when available after successful payment confirmation.';
