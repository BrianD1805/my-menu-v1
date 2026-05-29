# Orduva Ver-0.180A — Stop platform login screen flashing between pages

## Summary

This patch stops the owner platform login/access screen from flashing during normal navigation between `/platform`, `/platform/onboarding`, and `/platform/security`.

## Changes

- Added a shared `app/platform/layout.tsx` so all platform pages are wrapped by one persistent `OwnerPlatformAccessGate`.
- Removed individual gate wrappers from each platform page.
- Switched internal platform navigation from normal `<a>` links to Next `<Link>` navigation.
- Added a calm “Checking secure access…” restore state while a saved owner session is being verified.
- The full login/key screen now only appears after Orduva confirms there is no valid saved owner session.
- Version bumped to Ver: 0.180A.

## Supabase

No Supabase SQL required.
