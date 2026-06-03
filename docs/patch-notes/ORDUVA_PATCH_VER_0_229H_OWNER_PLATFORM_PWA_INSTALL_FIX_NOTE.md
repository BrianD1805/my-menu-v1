# Orduva Patch Ver-0.229H — Owner Platform PWA Install Fix

## Summary
Fixes the Owner Platform PWA identity/install behaviour so the browser is given a dedicated owner manifest, owner service worker, and the approved owner icon set instead of falling back to the Tenant Admin install identity.

## Key changes
- Added a dedicated static Owner Platform manifest at `public/orduva-owner-platform.webmanifest`.
- Updated Owner Platform metadata/head links to point to the static owner manifest.
- Added `OwnerPlatformPwaRegistrar` so `/platform` explicitly registers the Owner Platform manifest, favicon, apple icon, and scoped service worker.
- Rebuilt the Owner Platform favicon/PWA icons from the user-supplied artwork without cropping or changing the white canvas.
- Updated Owner Platform service worker cache version to Ver-0.229H.
- Replaced the confusing refresh message with clearer browser/iPhone install guidance if the browser still does not expose the native install prompt.

## No SQL
No Supabase SQL required.
