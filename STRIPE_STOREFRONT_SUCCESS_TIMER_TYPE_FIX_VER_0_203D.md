# Orduva Ver-0.203D — Stripe success timer type fix

This micro-patch fixes a local Next.js TypeScript build error in:

`app/checkout/payment/stripe/success/StripeSuccessStatusClient.tsx`

The success-page polling timer is now typed as `number | null`, matching `window.setTimeout` in the browser.

No Supabase SQL is required for this patch beyond the Ver-0.203C SQL already supplied.
