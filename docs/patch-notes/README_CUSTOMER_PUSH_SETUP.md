# Orduva Ver-0.106 — customer push setup

Apply this SQL in Supabase SQL Editor before expecting saved customer devices to work:

- `supabase/migrations/2026-04-22_ver_0_106_customer_push_subscriptions.sql`

Then test:
1. Place an order on the storefront.
2. On the success page, use **Enable customer push**.
3. Check that **Saved devices** becomes `1`.
4. Use **Send real customer push test**.
5. Update the order status from admin and confirm the customer device receives push updates.
