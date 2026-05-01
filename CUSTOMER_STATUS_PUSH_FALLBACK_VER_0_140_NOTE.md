# Orduva Ver-0.140 — Customer Status Push Fallback and Logging

This patch hardens the customer order-status push path.

## Changes

- Status-change customer push first looks for enabled subscriptions linked to the exact `order_id`.
- If none are found, it falls back to enabled subscriptions linked to the same `customer_account_id`.
- If customer-account subscriptions are used, Orduva relinks those device subscriptions to the current order for future diagnostics.
- Phone/name fallback remains as a final safety net.
- Customer push send attempts are logged to `notification_events` with sent/warning/failed status.
- Stale 404/410 customer push subscriptions are disabled automatically.

## Important browser limitation

Browsers do not allow a website/PWA to enable push notifications silently without customer permission. The customer must approve notifications at least once on the device.

After permission has been granted, Orduva should quietly relink/refresh that device for future signed-in orders wherever possible.
