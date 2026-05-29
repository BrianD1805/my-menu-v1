# Orduva Ver-0.141A — Customer Push Reminder Popup Layout Fix

Fixes the Ver-0.141 cart-entry push reminder popup so it uses a robust centred modal layout on desktop and mobile.

Changes:
- Adds inline layout guards to force the modal overlay to cover the full viewport.
- Centres the popup with flex alignment.
- Forces the popup panel width to `min(92vw, 28rem)` so it cannot collapse to a tiny right-side strip.
- Keeps the existing reminder behaviour unchanged.

No logic changes to push, orders, checkout, customer accounts, admin, theme editor, onboarding, or wildcard routing.
