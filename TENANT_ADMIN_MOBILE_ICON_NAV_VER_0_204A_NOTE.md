# Orduva Ver-0.204A — Tenant admin mobile icon navigation

## Summary

Replaced the mobile tenant admin bottom navigation buttons with a cleaner app-style icon navigation bar.

## Behaviour

- Mobile bottom nav now shows app-style icons with smaller labels underneath.
- The active page uses the Orduva orange highlight.
- Pressing a nav item gives a clear touch response before navigating.
- Desktop navigation is unchanged.
- No Supabase SQL required.

## Files touched

- components/admin/AdminShell.tsx
- lib/version.ts
- public/sw.js
- components/menu/StorefrontClientLoader.tsx
