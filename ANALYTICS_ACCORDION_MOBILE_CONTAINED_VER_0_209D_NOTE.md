# Orduva Ver-0.209D — Analytics Accordion Mobile Containment Polish

This patch tightens the Analytics accordion layout after mobile testing.

## Changed files

- components/analytics/AnalyticsDashboardPanel.tsx
- lib/version.ts
- public/sw.js
- ANALYTICS_ACCORDION_MOBILE_CONTAINED_VER_0_209D_NOTE.md

## Summary

- Rebuilt the Analytics accordion as a controlled button/listing pattern rather than native details/summary.
- Matched the Tenant Settings per-item storefront colours accordion more closely.
- Kept each opened accordion panel contained on mobile so dropped-down data stays inside the screen.
- Changed the accordion wrapper/background from dull grey to a pale green.
- Added mobile-safe wrapping to analytics list rows so count pills and long page/product names do not push off-screen.
- Left desktop layout intact.
- No analytics tracking, API or Supabase changes.

## Supabase

No Supabase SQL required for Ver-0.209D.
