# Orduva Ver-0.213C — Currency Suffix Control + Blank Default

## Purpose
Fixes the advanced currency display issue where the `/-` suffix could appear on a new store even when it was not intended for that tenant.

## What changed
- Changed the global default currency suffix from `/-` to blank.
- Removed the automatic `/-` suffix from new Kenyan/KES onboarding defaults.
- Added a visible **Suffix** field to Tenant Admin → Settings → Advanced currency display.
- The suffix can now be edited or cleared per tenant.
- Existing tenants that already intentionally have `/-` saved in `currency_suffix` will keep it until edited.
- New stores will no longer inherit `/-` by default.

## Files touched
- `lib/money.ts`
- `lib/tenant-settings.ts`
- `components/admin/TenantSettingsForm.tsx`
- `app/api/public/tenants/route.ts`
- `app/api/platform/tenants/route.ts`
- `app/api/admin/tenants/route.ts`
- `lib/version.ts`
- `public/sw.js`

## Supabase
No Supabase SQL required. The `currency_suffix` column already exists.

## Testing
1. Open Tenant Admin → Settings → Advanced currency display.
2. Confirm a new **Suffix** field is visible.
3. Clear the suffix field and save.
4. Confirm sample prices no longer show `/-`.
5. Confirm a tenant that intentionally needs `/-` can enter it and save it.
6. Confirm a newly created store does not inherit `/-` by default.
