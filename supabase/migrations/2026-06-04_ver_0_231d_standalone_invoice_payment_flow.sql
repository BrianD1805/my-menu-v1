-- ORDUVA Ver-0.231D — Standalone invoice/deposit/statement payment flow
-- Separates customer-entered payments from normal products/cart/checkout.
-- No new public tables are created, so no new table GRANT is required.

alter table public.tenant_settings
  add column if not exists invoice_payments_invoice_enabled boolean not null default true,
  add column if not exists invoice_payments_deposit_enabled boolean not null default true,
  add column if not exists invoice_payments_balance_enabled boolean not null default true;

-- Standalone payment records do not represent a normal product/stock item.
-- Existing product order rows continue to store product_id as normal.
alter table public.order_items
  alter column product_id drop not null;
