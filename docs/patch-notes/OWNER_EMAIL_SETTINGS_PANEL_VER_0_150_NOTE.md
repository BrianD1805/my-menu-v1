# Orduva Ver-0.150 — owner email settings/admin test email panel

This build adds an owner-facing email settings and test panel in Admin > Settings.

## What changed

- Bumped app version to Ver: 0.150.
- Added `components/admin/OwnerEmailSettingsPanel.tsx`.
- Added `/api/admin/email-settings/test` with GET status and POST test-email behaviour.
- Extended `lib/onboarding-email.ts` with runtime status and owner test email helpers.
- The panel checks `RESEND_API_KEY`, `ORDUVA_EMAIL_FROM`, and `ORDUVA_OWNER_EMAIL`.
- Test email results are logged in `notification_events` with `channel = email`.

## Required environment variables

```env
RESEND_API_KEY=
ORDUVA_EMAIL_FROM=Orduva <hello@orduva.com>
ORDUVA_OWNER_EMAIL=owner@example.com
```

No Supabase schema changes are required.
