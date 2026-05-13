# Orduva Ver-0.213 — Yoco Webhook Setup + Paid Order Confirmation

This patch adds the Yoco webhook hardening layer after Ver-0.212A confirmed the hosted Yoco checkout redirect/test payment flow.

## What changed

- Added `/api/storefront/yoco/webhook` for Yoco Checkout webhook delivery.
- Added Yoco webhook signature verification using `webhook-id`, `webhook-timestamp`, `webhook-signature` and the tenant saved `whsec_` webhook secret.
- Added replay protection using Yoco's timestamp guidance.
- Added a server-side event ledger table for idempotency and troubleshooting.
- Added `/api/admin/settings/yoco-webhook` so tenant admin can register the webhook from the app instead of running commands.
- Added a **Register Yoco webhook** button inside Tenant Admin → Settings → Yoco customer payments.
- Added webhook ID/URL storage in tenant settings.
- Paid Yoco webhooks now create/confirm paid orders, reduce stock once only, and notify admin/customer through the existing paid-order path.
- Failed/cancelled Yoco events mark the payment intent as failed/cancelled when no order has been created.

## Supabase

Run `SUPABASE_VER_0_213_YOCO_WEBHOOK_PAID_CONFIRMATION.sql` before deployment.

## Important

Yoco test/live API keys must still be kept secret. The webhook secret is created by Yoco and saved server-side only. Do not paste keys into chat.
