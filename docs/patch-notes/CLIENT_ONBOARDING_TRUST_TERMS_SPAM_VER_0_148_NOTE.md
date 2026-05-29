# Orduva Ver-0.148 — client onboarding trust, terms and spam protection

This build polishes the public client onboarding flow before payment/free-trial work.

## Summary

- Public client onboarding remains on the Orduva homepage.
- No payment or free-trial logic has been added yet.
- Clients must confirm basic setup terms before a store is created.
- Public onboarding API now checks terms/consent flags, honeypot, minimum form completion time, and a simple per-IP rate limit.
- The owner platform onboarding route remains separate.

## Files changed

- app/page.tsx
- app/api/public/tenants/route.ts
- components/admin/TenantOnboardingManager.tsx
- lib/version.ts

## Supabase

No Supabase SQL required.
