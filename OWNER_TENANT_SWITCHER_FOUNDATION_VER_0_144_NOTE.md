# Orduva Ver-0.144 — Orduva owner tenant switcher foundation and Store address wording cleanup

## Purpose

This build improves the Orduva owner/admin experience now that multiple tenant stores can be created through wildcard onboarding.

## What changed

- Replaced visible customer/admin-facing "tenant slug" wording with the friendlier phrase "Store address".
- Updated the admin identity bar from "Active tenant" to "Active store".
- Added an owner-facing store list entry point from the admin shell.
- Enhanced the platform onboarding recent stores list so each store shows:
  - Store name
  - Store address
  - Open storefront action
  - Switch to this store admin action
- Added admin login support for a prefilled store address using `/admin/login?tenant=<store-address-name>`.

## Safety note

The switcher is only a foundation. It does not bypass tenant isolation and it does not allow a normal store admin to edit another store automatically.

The switch action opens the admin login with the selected store address prefilled. The user still has to sign in as an owner for that store before editing anything.

## SQL

No Supabase SQL required.
