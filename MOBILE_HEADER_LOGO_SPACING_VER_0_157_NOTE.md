# Orduva Ver-0.157 — Mobile Header Logo Spacing Polish

## Summary

This build protects the mobile storefront header controls from wide uploaded logos.

## Changes

- Reduced the mobile storefront header logo maximum width.
- Reduced the mobile storefront header logo maximum height slightly.
- Added mobile-only safe horizontal padding around the centred logo area.
- Applied the same safe mobile width cap to the text fallback store name when no logo is available.
- Kept tablet/desktop header logo sizing unchanged.

## Not changed

- Logo upload and Supabase Storage handling.
- Tenant settings page behaviour.
- Product card UI.
- Cart/search/customer account logic.
- Wildcard routing.
