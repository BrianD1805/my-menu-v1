# Orduva Ver-0.213B — Yoco live-mode readiness polish

This patch polishes the tenant Yoco settings flow before using Live Yoco credentials.

## Scope

- Tenant Admin Yoco settings only.
- No Supabase SQL required.
- No checkout/order logic rewrite.
- No Stripe, storefront product card, owner platform or analytics changes.

## What changed

- Added a Yoco live-mode readiness checklist in Tenant Admin settings.
- Changing Yoco mode from Test to Live now resets the visible checkout switch and webhook state in the form so Test and Live credentials are not mixed accidentally.
- Saving a changed Yoco mode or a new Yoco secret key clears the previously saved Yoco webhook secret/id/url unless a fresh webhook secret is supplied.
- Live mode now requires a saved webhook before the tenant can expose Yoco on customer checkout.
- The Register Yoco webhook button is disabled until the selected mode/secret key has first been saved.
- Yoco webhook registration now prefers the production public Orduva origin, so the webhook URL is not accidentally registered against admin.orduva.com or a Netlify preview host.

## Testing

1. Open Tenant Admin > Settings > Storefront payment options.
2. Confirm the Yoco live-mode readiness checklist appears.
3. With Test mode already working, confirm checkout remains available.
4. Change Yoco mode to Live and confirm the webhook/checkout readiness is reset.
5. Save the Live Secret Key.
6. Register the Live webhook.
7. Only then switch Show Yoco on customer checkout back on.

## Supabase SQL

No Supabase SQL required for Ver-0.213B.
