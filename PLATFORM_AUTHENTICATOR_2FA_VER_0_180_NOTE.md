# Orduva Ver-0.180 — Platform authenticator 2FA foundation

Adds Google Authenticator-compatible TOTP security for Orduva owner platform pages.

## Included

- New `/platform/security` owner page.
- Owner platform access now supports platform key + 6-digit authenticator code.
- Manual setup key for Google Authenticator / Microsoft Authenticator / Authy.
- Session token after successful 2FA verification.
- Platform API routes now require the 2FA session token once authenticator security is enabled.
- Supabase SQL included in `SUPABASE_VER_0_180_PLATFORM_AUTHENTICATOR_2FA.sql`.

## Recovery

If the authenticator phone is lost, use the recovery SQL comments in the Supabase SQL file to disable 2FA, then set it up again.
