# Orduva Ver-0.189A — Tenant admin popup/header correction

## What changed

- Moved the checklist/trial popups into a body-level portal so they centre against the real viewport, not the sticky header container.
- Rebuilt the popup shell as a fixed full-screen overlay with equal left/right padding and a constrained scrollable content area.
- Rebalanced the sticky admin header for the lighter/pale header treatment: dark readable text, orange accents, and light action tiles instead of white-on-white controls.
- Kept the checklist and trial controls compact for mobile.

## Supabase SQL

No Supabase SQL required.
