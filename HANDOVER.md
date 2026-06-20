# Orduva Ver-0.243 Tenant Admin Popup Standard

This patch applies the approved Tenant Admin desktop popup sizing and placement rules, grey top-right close icon, right-aligned sticky footer actions, and reusable popup CSS classes for future Tenant Admin popups.

Exact rule summary:
- Overlay: fixed full-screen, centred flex layout, dark blurred backdrop.
- Mobile spacing: 35px left/right and 75px top/bottom.
- Desktop spacing: 10px left/right and 25px top/bottom.
- Modal shell: width 100%, desktop max-width 1040px, desktop max-height calc(100dvh - 50px), rounded 30px, hidden outer overflow.
- Header: sticky top, visible at all times.
- Body: only scrollable area, internal scrollbar only.
- Footer: sticky bottom, visible at all times.
- Top-right close icon: grey X on white button.
- Footer close/action button: right-aligned on desktop, 180px wide where it is a single close action.

# Orduva Ver-0.238F handover

This patch fixes Settings panel styling complaints after Ver-0.238E.

Touched files:
- app/globals.css
- components/admin/TenantSettingsForm.tsx
- lib/version.ts

No Supabase SQL required.

## Ver-0.243 patch note

- Desktop storefront popup correction only.
- Product details popup was moved up 10px on desktop.
- Rewards, Offers, Favourites and Buy Again desktop popup wrappers now follow the product details popup size standard.
- Favourites and Buy Again internal strip layouts remain unchanged; only the popup wrapper/close handling was corrected.
- No Supabase SQL required.


## Ver-0.243 note
Active Billing popup close-button sizing, desktop spacing, and Stripe next-payment countdown fixes. No SQL required.

## Ver-0.243 patch note

Active Billing popup desktop max width and max height were increased while keeping mobile unchanged and preserving the 180px desktop Close button. No SQL required.
