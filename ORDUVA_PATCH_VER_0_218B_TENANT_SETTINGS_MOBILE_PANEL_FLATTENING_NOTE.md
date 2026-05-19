# Orduva Patch Ver-0.218B — Tenant settings mobile panel flattening

## Purpose

This patch is a Tenant Admin settings UX-only polish pass after Ver-0.218A.

The mobile settings page had become cramped because the main settings accordion opened, then the payment gateway accordion opened, then the gateway content sat inside another visible sub-container. This reduced the available screen width and made the Direct M-Pesa / Daraja settings harder to work with on smaller phones.

## Changes

- Centres the Tenant Settings form/container more consistently on mobile and desktop.
- Gives the main settings panels a visible 1px green-toned border.
- Uses a slightly darker green panel background so individual panels are easier to distinguish.
- Removes heavy shadows from the settings section panels.
- Flattens the payment gateway accordions so their opened content appears inside the same visible payment gateway container.
- Removes the extra visible inner bordered sub-container around Stripe, Yoco, Pesapal and Direct M-Pesa gateway content.
- Keeps the Cash on Collection and Cash on Delivery panels visible and styled consistently.
- Keeps the Direct M-Pesa / Daraja live-readiness logic from Ver-0.218A intact.

## Not changed

- No Stripe payment logic changed.
- No Yoco payment logic changed.
- No Pesapal payment logic changed.
- No Direct M-Pesa / Daraja callback or order reconciliation logic changed.
- No Supabase schema changes.

## Version

Ver: 0.218B

## Supabase SQL

No Supabase SQL required.
