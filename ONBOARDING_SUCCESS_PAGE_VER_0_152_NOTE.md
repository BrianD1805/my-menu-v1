# Orduva Ver-0.152 — Dedicated onboarding success page after store creation

This patch redirects public client onboarding to a dedicated success page after a store is created.

## What changed

- Bumped version to Ver: 0.152.
- Added `/start-your-store/success`.
- Public onboarding redirects to the success page after store creation.
- The success page shows store name, store address, owner login status, email status, store link, admin login link, and setup checklist.
- The original public onboarding form remains at `/start-your-store`.
- Owner platform access gate and owner platform tools are untouched.

## Notes

The redirect passes non-sensitive success data in the URL query string: store name, slug, owner-created flag, and email status. It does not pass the owner password or private keys.
