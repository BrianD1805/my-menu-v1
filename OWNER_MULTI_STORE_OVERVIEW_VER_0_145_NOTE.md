# Orduva Ver-0.145 — Owner dashboard polish for multi-store overview

## Purpose

This patch polishes the Orduva platform owner onboarding page so it feels more like a SaaS owner dashboard when managing multiple client stores.

## What changed

- Bumped live version to `Ver: 0.145`.
- Added an owner-facing multi-store overview card on the platform onboarding page.
- Added quick metrics for stores loaded, setup stores, active stores, and stores added this week.
- Added a latest-store panel with direct storefront and admin-login actions.
- Added an owner quick-checks panel for wildcard routing, active store identity, branding/currency, and push/order tests.
- Improved the owner store list header and each store card with quick-check guidance.

## Safety notes

- This remains an Orduva owner/platform tool.
- The switcher still only opens the store admin login with the store address prefilled.
- It does not grant cross-tenant editing access.
- No Supabase schema change is required.

## Not touched

- Wildcard tenant routing.
- Netlify domain setup.
- Storefront product card UI.
- Push notification logic.
- Customer account/order linkage.
- Advanced theme editor logic.
