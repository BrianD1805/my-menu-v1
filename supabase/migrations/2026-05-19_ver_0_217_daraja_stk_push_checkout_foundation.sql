-- Orduva Ver-0.217 — Direct M-Pesa Daraja STK Push checkout foundation
-- Run in Supabase SQL Editor before deploying Ver-0.217.
-- Adds Daraja/STK tracking columns to storefront_payment_intents and allows provider='daraja'.
-- This starts STK Push only. Paid order creation remains for the next callback/reconciliation build.

alter table public.storefront_payment_intents
  add column if not exists daraja_merchant_request_id text,
  add column if not exists daraja_checkout_request_id text,
  add column if not exists daraja_account_reference text,
  add column if not exists daraja_phone_number text,
  add column if not exists daraja_result_code text,
  add column if not exists daraja_result_description text,
  add column if not exists daraja_mpesa_receipt_number text,
  add column if not exists daraja_callback_payload jsonb,
  add column if not exists daraja_stk_response jsonb;

create unique index if not exists storefront_payment_intents_daraja_checkout_uidx
  on public.storefront_payment_intents (daraja_checkout_request_id)
  where daraja_checkout_request_id is not null;

create index if not exists storefront_payment_intents_daraja_merchant_idx
  on public.storefront_payment_intents (daraja_merchant_request_id)
  where daraja_merchant_request_id is not null;

create index if not exists storefront_payment_intents_daraja_reference_idx
  on public.storefront_payment_intents (daraja_account_reference)
  where daraja_account_reference is not null;

alter table public.storefront_payment_intents
  drop constraint if exists storefront_payment_intents_provider_check;

alter table public.storefront_payment_intents
  add constraint storefront_payment_intents_provider_check
  check (provider in ('stripe', 'yoco', 'mpesa', 'daraja'));

comment on column public.storefront_payment_intents.daraja_merchant_request_id is 'Safaricom Daraja MerchantRequestID returned by STK Push.';
comment on column public.storefront_payment_intents.daraja_checkout_request_id is 'Safaricom Daraja CheckoutRequestID returned by STK Push.';
comment on column public.storefront_payment_intents.daraja_account_reference is 'AccountReference sent to Daraja for this Orduva checkout intent.';
comment on column public.storefront_payment_intents.daraja_phone_number is 'Normalised Kenyan phone number used for the STK Push request.';
comment on column public.storefront_payment_intents.daraja_stk_response is 'Raw initial STK Push response from Safaricom Daraja.';
comment on column public.storefront_payment_intents.daraja_callback_payload is 'Reserved for the Daraja callback/reconciliation build.';
