# Orduva Patch Ver-0.218A — Direct M-Pesa live-readiness polish

## Purpose

This patch is a light safety and UX polish pass after Ver-0.218 was confirmed working for Direct M-Pesa / Safaricom Daraja callback and order reconciliation.

## Changes

- Updates the Direct M-Pesa / Safaricom Daraja settings copy to reflect the now-working Ver-0.218 flow.
- Adds a clear live tenant checklist in the Daraja settings card.
- Warns when Live mode is selected while the sandbox shortcode `174379` is still entered.
- Prevents enabling the Direct M-Pesa setup and checkout visibility when Live mode is selected with the sandbox shortcode.
- Adds a server-side guard so Live Direct M-Pesa checkout cannot proceed with Safaricom sandbox shortcode `174379`.
- Clarifies that the callback URL is now the active STK Push callback/reconciliation URL.
- Bumps the visible app version and service worker caches to Ver-0.218A.

## Touched files

- `components/admin/TenantSettingsForm.tsx`
- `lib/storefront-daraja.ts`
- `lib/version.ts`
- `public/sw.js`
- `ORDUVA_PATCH_VER_0_218A_DARAJA_LIVE_READINESS_POLISH_NOTE.md`

## Supabase SQL

No Supabase SQL required.

## Testing focus

1. Open Tenant Admin → Settings → Payments → Direct M-Pesa / Safaricom Daraja.
2. Confirm the live-readiness checklist appears.
3. Set mode to Live while shortcode is `174379` and confirm a warning appears.
4. Confirm checkout enable controls are blocked until a non-sandbox live shortcode/till/paybill is entered.
5. Confirm sandbox testing remains available when mode is Sandbox and credentials are present.
6. Confirm Stripe, Yoco and Pesapal sections are unchanged.
