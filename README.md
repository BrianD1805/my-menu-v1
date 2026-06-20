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

# Orduva Patch Ver-0.238F — Admin Settings panel colour and border fixes

Overwrite patch for Orduva Tenant Admin Settings UX corrections.

## Changes
- Removed the unwanted square grey open/focus borders from admin panels.
- Applied #9fbfdf as the admin Settings panel surface colour.
- Updated Settings panel body surfaces so closed and open panels keep the new blue tone.
- Updated version to Ver: 0.238F.

## SQL
No Supabase SQL required.

## Ver-0.243

Desktop storefront popup correction. No Supabase SQL required.


## Ver-0.243 note
Active Billing popup close-button sizing, desktop spacing, and Stripe next-payment countdown fixes. No SQL required.

## Ver-0.243 note

Active Billing popup desktop sizing cap increased so the modal can use the reduced desktop overlay padding. No SQL required.
