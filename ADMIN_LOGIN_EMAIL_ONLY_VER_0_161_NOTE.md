# Orduva Ver-0.161 — simplify admin login to email and password

## Purpose

This build simplifies the tenant admin login journey for normal store owners.

After public onboarding, clients should not have to understand or enter a store address / tenant slug. They can now sign in using only their owner email and password. Orduva finds the correct store account server-side.

## Changes

- Removed the visible Store address field from the normal admin sign-in panel.
- Admin login now accepts email + password only for normal clients.
- If a store-specific link includes `?tenant=...`, that store is still used silently.
- If no store is provided, the login API finds the active tenant owner account by email.
- If one matching store account exists, Orduva signs the user into that store.
- If the same email/password matches more than one store, Orduva asks for the store-specific admin link until a future store picker is added.
- Public onboarding now blocks duplicate owner emails for now, to keep the simple one-email-one-store model clear.
- Manual first-owner setup still has a store address field, because that is an owner/internal setup tool.

## Not touched

- Public onboarding form layout
- Dedicated onboarding success page
- Email sending
- Owner platform tools
- Interactive checklist logic
- Storefront UI
- Upload/storage logic
- Supabase schema

## SQL

No Supabase SQL required.
