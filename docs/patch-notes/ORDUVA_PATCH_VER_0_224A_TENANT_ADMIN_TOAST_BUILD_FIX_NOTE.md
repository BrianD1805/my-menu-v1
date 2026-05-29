# Orduva Patch Ver-0.224A — Tenant Admin Toast Build Fix

## Purpose
Fixes the local Next.js/TypeScript build error introduced in Ver-0.224 where the toast timer ref type conflicted with the browser `window.setTimeout` return value.

## Touched files
- `components/admin/TenantSettingsForm.tsx`
- `lib/version.ts`

## Change made
- Changed the toast timer ref to use a browser-safe `number | null` type.
- Preserved the premium top-right Tenant Admin toast behaviour from Ver-0.224.
- Bumped visible version to Ver: 0.224A.

## Supabase SQL
No Supabase SQL required.

## Safety notes
- No payment logic changed.
- No checkout logic changed.
- No product card UI changed.
- No receipt logic changed.
- No SEO logic changed.
