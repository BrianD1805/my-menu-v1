# Orduva Ver-0.149 — Client onboarding email / launch notification foundation

This build adds the first email notification foundation for public client onboarding.

## What changed

- Added `lib/onboarding-email.ts`.
- Public client onboarding now prepares launch emails after successful store creation.
- The client launch email includes:
  - store name
  - store address
  - admin login link with the store prefilled
  - first setup steps
  - no-payment-taken note
- The Orduva owner notification includes:
  - new store name
  - store address
  - owner name/email
  - admin login link
  - follow-up checks
- Email sending uses the Resend REST API if configured.
- If email is not configured, onboarding still succeeds and the email event is logged as skipped.
- Email events are logged into `notification_events` using `channel = 'email'`.
- The public success panel now shows launch email status.

## Environment variables

Optional email variables:

```text
RESEND_API_KEY=
ORDUVA_EMAIL_FROM=Orduva <hello@orduva.com>
ORDUVA_OWNER_EMAIL=owner@example.com
```

If `RESEND_API_KEY` is blank, store creation still works and the success screen still shows the store/admin links.

## Supabase

No new table is required. This build reuses `notification_events`.

## Not touched

- Wildcard tenant routing
- Storefront product cards
- Push notification logic
- Payment/free-trial logic
- Owner platform access-key protection
