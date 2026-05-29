# Orduva Patch Ver-0.216 — Direct M-Pesa Daraja Settings Foundation

## Purpose
Adds tenant admin settings fields for a future direct Safaricom M-Pesa / Daraja STK Push integration.

This patch is intentionally **settings-only**. It does not change customer checkout, does not add a Daraja callback route, and does not create orders from Daraja payments yet.

## What changed
- Added a new **Direct M-Pesa / Safaricom Daraja foundation** card under Tenant Admin → Settings → Payments.
- Stores tenant Daraja setup values:
  - Mode: sandbox/live
  - Consumer key
  - Consumer secret (saved server-side only)
  - Business shortcode / till / paybill
  - Passkey (saved server-side only)
  - Transaction type: CustomerPayBillOnline or CustomerBuyGoodsOnline
  - Account reference prefix
  - Future callback URL
  - Account label
  - Setup notes
- Adds a disabled “Show direct M-Pesa on customer checkout” line to make clear that checkout is locked until the later STK Push build.
- Preserves existing Stripe, Yoco and Pesapal behaviour.
- Keeps Pesapal diagnostics and sandbox safety from Ver-0.215A–0.215C.

## SQL
Run:

`supabase/migrations/2026-05-19_ver_0_216_daraja_settings_foundation.sql`

before deploying Ver-0.216.

## Version
- `lib/version.ts`: Ver: 0.216
- `public/sw.js`: cache keys bumped to `0-216`
