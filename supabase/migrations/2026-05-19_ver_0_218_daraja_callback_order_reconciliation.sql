-- Orduva Ver-0.218 — Daraja callback and order reconciliation
-- Run in Supabase SQL Editor before deploying Ver-0.218.
-- Allows paid orders to store payment_provider='daraja'.

alter table public.orders
  drop constraint if exists orders_payment_provider_check;

alter table public.orders
  add constraint orders_payment_provider_check
  check (payment_provider in ('cash', 'cod', 'stripe', 'yoco', 'mpesa', 'daraja', 'manual'));
