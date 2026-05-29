# Orduva Ver-0.203A — Stripe storefront order-after-payment fix

## Purpose

Fixes the Stripe storefront flow so clicking **Continue to secure payment** does not immediately create an order, notify the tenant, or deduct stock.

## Behaviour after this patch

- Cash on delivery / cash on collection still create orders immediately.
- Stripe creates a pending `storefront_payment_intents` row only.
- No order appears in tenant admin while the customer is still on Stripe.
- Stock is not deducted while the customer is still on Stripe.
- If the customer cancels Stripe Checkout, the intent is marked cancelled and no order is created.
- When Stripe confirms payment, Orduva creates one paid order, creates the order items, deducts stock once, and sends notifications.
- Repeating a cancelled Stripe attempt creates another payment intent, but it does not create duplicate orders or deduct stock.

## SQL required

Run `SUPABASE_VER_0_203A_STRIPE_ORDER_AFTER_PAYMENT.sql` before deploying.
