# Orduva Ver-0.211 — Yoco Tenant Payment Settings Foundation

This patch adds the tenant admin foundation for Yoco customer payment setup.

## Scope
- Tenant Admin → Store settings → Storefront payment options.
- Adds Yoco credential/mode/setup fields.
- Requires ZAR currency before Yoco setup can be enabled.
- Saves tenant-owned Yoco secrets server-side only.
- Keeps customer checkout activation off until the next Yoco checkout/webhook build.

## Changed files
- app/admin/settings/page.tsx
- app/api/admin/settings/route.ts
- app/api/products/route.ts
- app/checkout/page.tsx
- components/admin/TenantSettingsForm.tsx
- lib/storefront-payment-options.ts
- lib/tenant-settings.ts
- lib/types.ts
- lib/version.ts
- public/sw.js
- SUPABASE_VER_0_211_YOCO_TENANT_PAYMENT_SETTINGS_FOUNDATION.sql
- supabase/migrations/2026-05-13_ver_0_211_yoco_tenant_payment_settings_foundation.sql

## Supabase
Run `SUPABASE_VER_0_211_YOCO_TENANT_PAYMENT_SETTINGS_FOUNDATION.sql` before deploying.

## Important
This is not the hosted Yoco checkout flow yet. It prepares tenant settings and safe credential storage only.
