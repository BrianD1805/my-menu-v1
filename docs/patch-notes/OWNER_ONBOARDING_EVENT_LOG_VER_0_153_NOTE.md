# Orduva Ver-0.153 — owner onboarding event log / recent signups panel

Adds an owner-only recent public signups panel inside the protected Orduva platform area.

## Included

- New protected API route: `/api/platform/onboarding-events`
- New owner UI panel: `OwnerOnboardingEventsPanel`
- Recent stores created through onboarding
- Store address and admin login links
- Owner name/email where available
- Client launch email status
- Orduva owner notification email status
- Summary counts for recent stores, created today, email complete, and needs attention

## Security

The event log API requires the existing Orduva platform access key. The panel is only rendered inside the owner platform gate at `/platform/onboarding`.

## Not changed

- Public client onboarding
- Email sending logic
- Tenant admin settings
- Wildcard routing
- Supabase schema
