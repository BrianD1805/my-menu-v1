-- ORDUVA Ver-0.231B — Invoice payments settings and dedicated storefront cards
-- Adds tenant-level control for showing customer-entered amount products in a separate first storefront section.
-- No new public tables are created in this patch, so no new table GRANT is required.

alter table public.tenant_settings
  add column if not exists invoice_payments_enabled boolean not null default false,
  add column if not exists invoice_payments_section_title text not null default 'Payments',
  add column if not exists invoice_payments_intro_text text not null default 'Pay an invoice, deposit or statement balance securely online.';
