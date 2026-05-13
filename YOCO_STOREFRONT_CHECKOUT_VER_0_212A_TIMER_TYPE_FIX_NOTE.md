# Orduva Ver-0.212A — Yoco Success Timer Type Build Fix

## Purpose
Fixes the TypeScript build error in the Yoco payment success status polling client.

## Change
- Updated `app/checkout/payment/yoco/success/YocoSuccessStatusClient.tsx` timer typing from a timeout object style to a browser numeric timer.
- Bumped version/cache to Ver: 0.212A.

## Supabase SQL
No new Supabase SQL required for Ver-0.212A. Keep the Ver-0.212 SQL already run.

## Scope
No Yoco logic, checkout logic, Stripe logic, owner platform, storefront product UI, or tenant settings behaviour was changed.
