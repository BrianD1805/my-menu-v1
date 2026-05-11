# Orduva Ver-0.203C — Stripe storefront payment confirmation fix

## Purpose
Fixes live Stripe storefront payment behaviour after Ver-0.203A/B testing.

## Fixes included
- Prevents duplicate paid orders when Stripe sends both `payment_intent.succeeded` and `checkout.session.completed` close together.
- Adds a temporary `processing` state while one webhook is creating the real paid order.
- Updates the Stripe success page so it polls Orduva for the real order result instead of staying on `Checking / Waiting`.
- Clears the customer cart once Orduva confirms the paid order has been created.
- Fixes Return to store / Back to checkout links so they return to the tenant storefront instead of the Orduva landing page.
- Keeps the order-after-payment rule: no order and no stock reduction until Stripe confirms payment.

## SQL required
Run `SUPABASE_VER_0_203C_STRIPE_IDEMPOTENCY_AND_TEST_RESET.sql` before testing.

## Important testing note
After clearing test orders, manually reset product stock quantities if previous bad tests deducted stock.
