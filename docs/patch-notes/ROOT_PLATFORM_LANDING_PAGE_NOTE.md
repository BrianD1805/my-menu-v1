# Orduva Ver-0.126 — Root Platform Landing Page

This patch makes the Orduva root domain behave as the platform landing page instead of the ZimZa Express storefront.

## Expected routing

- `orduva.com` → Orduva platform landing page
- `www.orduva.com` → Orduva platform landing page
- `orduva.netlify.app` → Orduva platform landing page
- `zimzaexpress.orduva.com` → ZimZa Express storefront
- `admin.orduva.com` → Orduva Admin
- `localhost:3000` → existing development storefront fallback

## Scope kept deliberately narrow

This patch does not change:

- product cards
- add-to-cart animation
- admin product manager
- customer accounts
- checkout or order persistence
- admin/customer push notifications
- Supabase schema

## Testing

After deploy, test the following:

1. `https://orduva.com` shows the platform landing page.
2. `https://zimzaexpress.orduva.com` still shows ZimZa Express.
3. `https://admin.orduva.com` still shows admin.
4. A test order from `zimzaexpress.orduva.com` still stores under the ZimZa tenant.
