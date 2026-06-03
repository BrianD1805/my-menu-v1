# Orduva Patch Ver-0.229I — Owner Platform Stability and PWA Cache Fix

## Purpose
Fix the Owner Platform blank/skeleton page issue and remove risky dynamic-page caching from the Owner Platform PWA worker.

## Changes
- Replaced the Owner Platform service worker with a network-only worker used only for PWA installability.
- Cleared older `orduva-owner-platform-*` caches so partial dashboard pages are not reused.
- Registrar now unregisters older Owner Platform workers before registering the safer worker.
- Owner Platform menus are now click-open rather than hover-switched, avoiding incorrect hover/highlight behaviour.
- Kept the approved Owner Platform favicon/PWA artwork.
- Bumped visible version to Ver: 0.229I.

## SQL
No Supabase SQL required.
