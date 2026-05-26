-- Orduva Ver-0.222 — Premium customer receipts foundation
-- Run in Supabase SQL Editor before deploying Ver-0.222.
-- Adds receipt audit fields to customer orders.

alter table public.orders
  add column if not exists customer_receipt_number text,
  add column if not exists customer_receipt_last_downloaded_at timestamptz,
  add column if not exists customer_receipt_download_count integer not null default 0;

create index if not exists orders_customer_receipt_idx
  on public.orders (tenant_id, customer_account_id, customer_receipt_number)
  where customer_account_id is not null;
