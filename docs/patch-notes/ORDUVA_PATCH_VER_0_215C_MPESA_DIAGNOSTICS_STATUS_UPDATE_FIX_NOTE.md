# Orduva Patch Ver-0.215C — Pesapal diagnostics status update fix

## Purpose
Fixes the M-Pesa / Pesapal diagnostics action that should mark a stuck payment intent as failed after Pesapal returns a non-completed status.

## What changed
- Keeps the Ver-0.215B diagnostics lookup behaviour.
- Changes the admin action from an unsupported `checkout_pending_review` status to the existing allowed `failed` status.
- Adds explicit Supabase update error handling so future failures show a clear admin error instead of appearing to succeed silently.
- Updates the button wording to `Mark failed`.
- No order is created unless Pesapal returns COMPLETED.

## Safety
- Stripe untouched.
- Yoco untouched.
- Pesapal sandbox safety block from Ver-0.215A remains in place.
- No Supabase SQL required.

## Test
Use the failed Pesapal OrderTrackingId:

```txt
520349f3-5b29-4890-9f19-da604d53a2c0
```

Then click `Mark failed` and confirm the payment intent status changes from `checkout_started` to `failed`.
