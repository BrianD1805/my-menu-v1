# Orduva Patch Ver-0.226D — Stripe paid intent order recovery fix

## Purpose
Fix the regression where a successful live Stripe card payment could return to the success page but leave the cart uncleared and variant stock unreduced.

## Cause
A paid Stripe payment intent could exist before an Orduva order was created/linked. The previous recovery guard only claimed intents in `created` or `checkout_started`, so an intent already marked `paid` but missing `order_id` could be reported as paid without completing the Orduva order creation path.

## Fix
- Allow paid, orderless Stripe payment intents to be claimed for recovery.
- Make checkout-status create the missing Orduva order before returning a confirmed paid order.
- Keep browser cart clearing tied to a confirmed paid Orduva order.
- Preserve variant stock reduction through the normal paid-order creation path.

## SQL
No Supabase SQL required.
