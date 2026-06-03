# Orduva Patch Ver-0.229G — Owner Platform PWA Identity Fix

## Summary
Fixes the issue where installing from `/platform` on `admin.orduva.com` still offered the Tenant Admin PWA instead of the Owner Platform.

## Changes
- Owner Platform now force-injects its own manifest link and icon links on load.
- Added `public/owner-platform-sw.js` registered with scope `/platform`.
- Root manifest now returns Owner Platform manifest if the request referer is `/platform`.
- Owner Platform manifest ID was bumped so browsers treat it as a separate installable app identity.

## SQL
No Supabase SQL required.
