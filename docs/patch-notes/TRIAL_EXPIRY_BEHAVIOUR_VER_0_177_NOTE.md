# Orduva Ver-0.177 — Trial expiry behaviour

## Summary

Adds trial-expiry behaviour without hiding the storefront.

- Storefront remains visible after a trial expires.
- Checkout is blocked for expired trials with a polite customer message.
- The order API also blocks expired trial orders server-side.
- Tenant admin trial banner now clearly says checkout is paused when expired.
- Owner platform readiness panel includes quick trial override buttons:
  - +7 trial days
  - +1 day
- New owner/platform API route: `/api/platform/trials/extend`.

## Supabase SQL

No new Supabase SQL required. This uses the Ver-0.175 trial fields.
