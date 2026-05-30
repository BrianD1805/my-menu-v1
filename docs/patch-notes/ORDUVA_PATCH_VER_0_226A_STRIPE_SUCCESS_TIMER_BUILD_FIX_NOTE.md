# Orduva Patch Ver-0.226A — Stripe Success Timer Build Fix

Fixed the local build TypeScript error in `StripeSuccessStatusClient.tsx` by using a browser-safe `number | null` timeout handle for `window.setTimeout`.

No Supabase SQL required.

Preserved Ver-0.226 behaviour:
- Stripe success recovery
- paid order wording fix
- variant payload cleanup
- paid variant stock reduction support
