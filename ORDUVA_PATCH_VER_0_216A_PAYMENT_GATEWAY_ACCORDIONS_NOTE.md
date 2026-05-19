# Orduva Patch Ver-0.216A — Payment gateway accordions in Tenant Settings

## Summary

This is a UX-only Tenant Admin settings patch.

It keeps Cash/COD visible at the top of the Storefront payment options section, then places each online payment provider into its own compact dropdown accordion:

- Stripe customer payments
- Yoco customer payments
- M-Pesa / Pesapal customer payments
- Direct M-Pesa / Safaricom Daraja

The goal is to reduce scrolling and make the Direct M-Pesa / Daraja settings much quicker to reach.

## Behaviour preserved

- Stripe logic unchanged.
- Yoco logic unchanged.
- Pesapal safety and diagnostics unchanged.
- Direct Daraja settings foundation unchanged.
- No storefront checkout changes.
- No payment provider enablement changes.

## Files touched

- `components/admin/TenantSettingsForm.tsx`
- `lib/version.ts`
- `public/sw.js`

## Supabase SQL

No Supabase SQL required.

## Testing checklist

1. Open `/admin/settings`.
2. Open `Storefront payment options`.
3. Confirm Cash on collection and Cash on delivery remain visible.
4. Confirm online gateways are now listed as compact accordion rows.
5. Open Stripe and confirm existing fields/save behaviour remain present.
6. Open Yoco and confirm existing fields/webhook/live readiness remain present.
7. Open M-Pesa / Pesapal and confirm diagnostics still appears.
8. Open Direct M-Pesa / Safaricom Daraja and confirm Ver-0.216 fields still save.
9. Confirm M-Pesa checkout remains disabled unless explicitly configured.
10. Confirm no Stripe/Yoco/Pesapal/Daraja payment logic has changed.

## Deploy commands

```bash
git add .
git commit -m "Orduva Ver-0.216A add payment gateway accordions"
git push origin main
```
