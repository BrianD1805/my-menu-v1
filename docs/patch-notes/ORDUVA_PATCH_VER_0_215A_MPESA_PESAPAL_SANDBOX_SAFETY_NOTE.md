# Orduva Patch Ver-0.215A — M-Pesa / Pesapal sandbox safety and callback hardening

## Purpose

This patch responds to the Pesapal sandbox test problem where a real Kenyan M-Pesa wallet was debited while using Pesapal sandbox/test mode.

## Changes

- Adds a server-side safety block for Pesapal sandbox hosted checkout.
- Sandbox/test mode can still be configured in Tenant Admin, but storefront checkout will not submit to Pesapal sandbox unless the server environment variable below is deliberately set:

```txt
ORDUVA_ALLOW_PESAPAL_SANDBOX_CHECKOUTS=true
```

- Adds a clear warning in Tenant Admin settings explaining that Pesapal sandbox hosted checkout may still trigger a real M-Pesa debit when a real phone wallet is used.
- Preserves live Pesapal mode for controlled tenant merchant testing.
- Adds the merchant reference to the callback and cancellation URLs so Orduva has a second matching reference when Pesapal returns or sends IPN data.
- Keeps Stripe and Yoco untouched.

## Recommended testing policy

Do not expose Pesapal sandbox hosted checkout to public storefronts. For real end-to-end mobile-money testing, use the tenant's own live Pesapal merchant account and make a very small controlled transaction.

## Supabase SQL

No Supabase SQL required.
