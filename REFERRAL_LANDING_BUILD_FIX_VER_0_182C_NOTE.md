# Orduva Ver-0.182C — Referral landing build fix

Fixes the Next.js 15 `searchParams` page prop type error introduced in Ver-0.182B.

## Change

`app/page.tsx` now types `searchParams` as a Promise-only page prop, matching the Next.js 15 generated `PageProps` constraint used during Netlify production builds.

## Supabase SQL

No Supabase SQL required.
