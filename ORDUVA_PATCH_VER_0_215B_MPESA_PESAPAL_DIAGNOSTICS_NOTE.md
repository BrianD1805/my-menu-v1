# Orduva Patch Ver-0.215B — M-Pesa / Pesapal recovery and diagnostics panel

## Purpose
Adds an admin-only Pesapal recovery and diagnostics panel to Tenant Admin settings so stuck M-Pesa/Pesapal checkout attempts can be checked safely from inside Orduva instead of using manual SQL and PowerShell.

## What changed
- Added `/api/admin/settings/mpesa-diagnostics`.
- Added an M-Pesa/Pesapal diagnostics panel inside Tenant Admin → Settings → Payments.
- The panel accepts a checkout ID, Pesapal `OrderTrackingId`, or Orduva merchant reference.
- The panel calls Pesapal `GetTransactionStatus` server-side using the tenant's saved Pesapal credentials.
- It displays:
  - Orduva payment intent details
  - Pesapal status and status code
  - HTTP response status
  - confirmation code
  - payment method
  - raw Pesapal response for support/debugging
- It only enables order creation when Pesapal reports the payment as completed.
- It can mark non-completed attempts as failed/pending review.

## Safety rules
- Stripe and Yoco flows were not changed.
- Normal M-Pesa checkout behaviour was not relaxed.
- Ver-0.215A sandbox safety block remains in place.
- The recovery endpoint is tenant-admin scoped and does not expose tenant Pesapal secrets.
- Order creation is blocked unless Pesapal returns a completed status.

## Supabase SQL
No Supabase SQL required.

## Local testing
Run locally:

```bash
npm run build
npm run dev
```

Then open:

```txt
/admin/settings → Payments → M-Pesa / Pesapal → Pesapal recovery and diagnostics
```

Test with a known `OrderTrackingId`, for example:

```txt
520349f3-5b29-4890-9f19-da604d53a2c0
```

Expected result for the current failed test: the panel should show Pesapal as not completed/invalid/pending and keep Create order disabled.

## Deployment

```bash
git add .
git commit -m "Orduva Ver-0.215B add Pesapal recovery diagnostics panel"
git push origin main
```
