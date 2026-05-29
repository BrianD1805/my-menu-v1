# Orduva Patch Ver-0.222 — Premium Customer Receipts Foundation

## Summary
Adds a premium downloadable customer receipt from the signed-in customer account area. This avoids the complexity of WhatsApp Business API while still giving customers a polished receipt they can open, print, or save as PDF.

## What changed
- Adds a signed-in customer receipt endpoint:
  - `/api/customer/orders/[orderId]/receipt`
- Adds a `Download receipt` button to recent orders inside `/account`.
- The receipt opens as a premium printable HTML receipt with:
  - Store name
  - Receipt reference
  - Order date
  - Customer details
  - Fulfilment/address
  - Payment method/reference
  - Itemised order lines
  - Subtotal/rewards/discount adjustments
  - Total paid
- Adds receipt audit fields on orders:
  - `customer_receipt_number`
  - `customer_receipt_last_downloaded_at`
  - `customer_receipt_download_count`

## Safety
- Customer can only download receipts for their own signed-in account and current tenant.
- No WhatsApp API or external messaging was added.
- No payment, reward, discount, product card, Daraja, Stripe, Yoco or Pesapal logic was changed.

## SQL
Run `supabase/migrations/2026-05-26_ver_0_222_premium_customer_receipts.sql` before deploying.
