# Orduva Ver-0.238F handover

This patch fixes Settings panel styling complaints after Ver-0.238E.

Touched files:
- app/globals.css
- components/admin/TenantSettingsForm.tsx
- lib/version.ts

No Supabase SQL required.

## Ver-0.242B patch note

- Desktop storefront popup correction only.
- Product details popup was moved up 10px on desktop.
- Rewards, Offers, Favourites and Buy Again desktop popup wrappers now follow the product details popup size standard.
- Favourites and Buy Again internal strip layouts remain unchanged; only the popup wrapper/close handling was corrected.
- No Supabase SQL required.


## Ver-0.242B note
Active Billing popup close-button sizing, desktop spacing, and Stripe next-payment countdown fixes. No SQL required.

## Ver-0.242B patch note

Active Billing popup desktop max width and max height were increased while keeping mobile unchanged and preserving the 180px desktop Close button. No SQL required.
