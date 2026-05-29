# Orduva Ver-0.119 — storefront success page UX refresh

## Scope
This patch tidies the customer-facing storefront checkout success page.

## Changes
- Bumped visible app version to `Ver: 0.119`.
- Refreshed the desktop and mobile success page layout so it is cleaner and more balanced.
- Removed admin/dev-facing explanation blocks from the customer success page.
- Simplified customer push notifications to one clear customer action: enable order updates.
- Removed customer-facing push test buttons and technical VAPID/device-count display from the success page.
- Reworded success page text so it speaks to the customer, not the admin/operator.
- Kept customer push registration/relinking behaviour intact.
- Kept admin push logic untouched.
- Kept order persistence/customer account linkage untouched.
- Kept product cards untouched.

## Testing focus
- Place an order on desktop and confirm the success page is balanced.
- Place an order on mobile and confirm the success page is clean and readable.
- Enable customer order updates once and allow browser notifications.
- Confirm customer order status notifications still arrive when admin changes status.
- Confirm admin new-order push still arrives.
