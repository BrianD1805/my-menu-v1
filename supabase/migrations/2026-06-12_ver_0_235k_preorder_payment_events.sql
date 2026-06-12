-- Orduva Ver-0.235K — Pre-order balance payment ledger
-- Run in Supabase SQL Editor before using "Mark balance paid" in Tenant Admin → Pre-orders.
-- Records manual balance payments so the customer account and order history have a payment audit trail.

create table if not exists public.order_payment_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  payment_stage text not null default 'full_payment',
  payment_source text not null default 'system',
  payment_status text not null default 'paid',
  amount numeric(10,2) not null default 0,
  currency_code text,
  payment_reference text,
  notes text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists order_payment_events_order_event_unique_idx
  on public.order_payment_events (order_id, event_type);

create index if not exists order_payment_events_tenant_order_idx
  on public.order_payment_events (tenant_id, order_id, created_at desc);

create index if not exists order_payment_events_stage_status_idx
  on public.order_payment_events (tenant_id, payment_stage, payment_status, created_at desc);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'order_payment_events_event_type_check') then
    alter table public.order_payment_events
      add constraint order_payment_events_event_type_check
      check (event_type in ('order_paid', 'preorder_deposit_paid', 'preorder_balance_paid', 'manual_payment'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'order_payment_events_payment_stage_check') then
    alter table public.order_payment_events
      add constraint order_payment_events_payment_stage_check
      check (payment_stage in ('full_payment', 'deposit', 'balance', 'adjustment'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'order_payment_events_payment_status_check') then
    alter table public.order_payment_events
      add constraint order_payment_events_payment_status_check
      check (payment_status in ('pending', 'paid', 'failed', 'refunded', 'cancelled'));
  end if;
end $$;

grant select, insert, update, delete
on public.order_payment_events
to service_role;
