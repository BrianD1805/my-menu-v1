# Orduva Ver-0.210 — Tenant Admin Premium Colour Refresh

## Purpose
Refresh the Tenant Admin visual system so it feels like a crisp, premium professional app without being dull or over-shadowed.

## Scope
Tenant Admin only.

This patch intentionally avoids storefront product cards, storefront checkout, Stripe/payment logic, Supabase schema, affiliate/referral logic and Owner Platform workflows.

## Palette applied
- App background: `#F8FAF7` — Porcelain Sage
- Panel/card background: `#FFFFFF` — Clean White
- Primary action: `#2563EB` — Premium Blue
- Primary hover: `#1D4ED8` — Deep Blue
- Success: `#16A34A` — Fresh Emerald
- Soft success: `#ECFDF3` — Soft Mint
- Accent: `#F59E0B` — Warm Amber
- Soft accent: `#FFF7E6` — Champagne
- Secondary accent: `#7C3AED` — Modern Violet
- Soft violet: `#F3EEFF` — Lavender Mist
- Information background: `#EEF6FF` — Ice Blue
- Main text: `#111827` — Charcoal Ink
- Secondary text: `#4B5563` — Slate Grey
- Muted text: `#6B7280` — Soft Slate
- Borders: `#E5E7EB` — Clean Line
- Soft borders: `#EDF0F2` — Whisper Line

## What changed
- Added a scoped `.orduva-admin-refresh` tenant-admin design wrapper.
- Reduced the shadow footprint across Tenant Admin cards, panels, nav and buttons.
- Updated the Tenant Admin shell/header/nav to the new blue/sage/white premium direction.
- Updated the tenant admin sign-in page to match the refreshed palette.
- Updated tenant admin PWA theme colours to the new premium blue.
- Preserved the solid white sticky tenant admin header requirement.
- Kept all functional logic unchanged.

## Files touched
- `app/globals.css`
- `components/admin/AdminShell.tsx`
- `app/admin/login/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/head.tsx`
- `app/admin/manifest.ts`
- `lib/version.ts`
- `public/sw.js`

## Supabase SQL
No Supabase SQL required for Ver-0.210.
