# Orduva Ver-0.209B — Analytics Accordion Layout

## Purpose
Reduce information overload on Tenant Admin and Owner Platform analytics dashboards by grouping the detailed analytics sections into premium accordion panels.

## Changed files
- components/analytics/AnalyticsDashboardPanel.tsx
- lib/version.ts
- public/sw.js

## What changed
- Keeps the headline explanation and key summary cards visible.
- Moves detailed analytics into accordion sections:
  - Product performance
  - Traffic, pages and subdomains / Traffic and pages
  - Recent activity
- Product performance opens by default so tenants immediately see viewed/shared/cart product results.
- Other detailed sections start collapsed to keep the page calmer.
- No analytics event tracking logic changed.
- No API changes.
- No Supabase changes.

## Supabase
No Supabase SQL required for Ver-0.209B.
