# Orduva Ver-0.200B — Stripe checkout connecting screen polish

## Purpose
Polish the temporary window shown between selecting a billing plan and being redirected to Stripe Checkout.

## Changes
- Updated the temporary checkout window copy to: “Hang on while we connect to Stripe’s secure server”.
- Centre-aligned the temporary checkout message on both desktop and mobile.
- Made the mobile message larger and easier to read.
- Added a deliberate 3-second pause before redirecting to Stripe so the customer has time to read the message.
- Kept Stripe Checkout opening in a separate window/tab.
- Bumped visible version to `Ver: 0.200B`.
- Bumped storefront/service worker cache strings to `ver-0-200b`.

## Testing
1. Open an unpaid/expired tenant billing activation flow.
2. Select a plan.
3. Confirm the new Stripe connection window is centred and readable on desktop.
4. Confirm the message is larger and centred on mobile.
5. Confirm the window stays on the message for around 3 seconds before Stripe Checkout loads.
6. Confirm Stripe Checkout still opens correctly.
