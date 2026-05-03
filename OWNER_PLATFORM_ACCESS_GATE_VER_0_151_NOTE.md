# Orduva Ver-0.151 — Owner platform access gate before page load

## Purpose

This patch protects the Orduva owner-only platform page at:

```text
https://www.orduva.com/platform/onboarding
```

The page now shows an owner access gate before any owner dashboard, store list, store creation tools, email settings, or switcher content appears.

## Behaviour

- The existing Orduva platform access key is used.
- The access key is validated through `/api/platform/access`.
- Owner content is hidden until the key is validated.
- The unlock is stored only in the current browser session using `sessionStorage`.
- A **Lock owner area** button clears the session unlock and returns the page to the gate.
- Public client onboarding remains separate at `/start-your-store` and is not affected.

## Files changed

```text
app/platform/onboarding/page.tsx
app/api/platform/access/route.ts
components/admin/OwnerPlatformAccessGate.tsx
components/admin/TenantOnboardingManager.tsx
components/admin/OwnerEmailSettingsPanel.tsx
lib/version.ts
```

## Supabase

No Supabase SQL required.
