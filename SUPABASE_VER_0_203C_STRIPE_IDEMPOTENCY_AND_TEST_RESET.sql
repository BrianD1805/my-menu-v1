-- Orduva Ver-0.203C — Stripe storefront idempotency/status fix
-- Allows the payment intent row to be claimed as "processing" while one webhook creates the order.
-- This prevents checkout.session.completed and payment_intent.succeeded creating duplicate paid orders at the same time.

begin;

alter table public.storefront_payment_intents
  drop constraint if exists storefront_payment_intents_status_check;

alter table public.storefront_payment_intents
  add constraint storefront_payment_intents_status_check
  check (status in ('created', 'checkout_started', 'processing', 'paid', 'failed', 'cancelled', 'expired', 'refunded'));

commit;

-- Optional test reset — run this separate block only when you want to clear order/payment testing data.
-- WARNING: This deletes order history and payment intent rows. It does not restore stock quantities.
-- begin;
-- delete from public.storefront_payment_intents;
-- delete from public.notification_events where order_id is not null;
-- delete from public.order_items;
-- delete from public.orders;
-- commit;
