# Orduva Patch Ver-0.214 — Tenant Settings UX Simplification

## Purpose
Simplify Tenant Admin > Settings without changing Stripe, Yoco, cash/COD, currency or storefront payment behaviour.

## What changed
- Converted each major settings block into a clear collapsible card/accordion.
- Added section grouping badges: Workspace, Brand, Theme, Contact and Payments.
- Added clearer helper text to each settings section header.
- Added Saved / Unsaved / Autosave labels in the accordion headers.
- Updated the Settings menu modal so each shortcut shows its group.
- Settings menu selections now open the relevant collapsed section before scrolling to it.
- Admin workspace starts open by default; the remaining heavy sections stay tucked away until selected.
- Bumped visible version to Ver: 0.214 and refreshed storefront service worker cache names.

## Safety notes
- Payment logic was not changed.
- Stripe keys, Stripe enablement, Yoco mode, Yoco webhook registration and Yoco checkout visibility checks were preserved.
- No Supabase SQL required.
