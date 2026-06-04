# Orduva Patch Ver-0.231D — Standalone Invoice Payment Flow

This patch separates customer-entered invoice/deposit/statement balance payments from the normal product/cart flow.

## Summary

- Tenant Settings controls the Payments section directly.
- Storefront shows three dedicated payment cards when enabled:
  - Pay Your Invoice
  - Pay a Deposit
  - Pay Statement Balance
- These cards do not use normal product cards, images, variants, stock, favourites, rewards, discounts or the cart.
- Clicking a payment card opens a dedicated payment popup and redirects straight to the tenant's configured online payment provider.
- Existing Stripe, Yoco, Pesapal and Daraja provider setup is preserved.

## SQL

Requires the Ver-0.231D migration because invoice payment order lines are not tied to a normal product row.
