# Orduva Patch Ver-0.230 — Password reset foundation

Adds forgot-password/reset-password flows for Tenant/Admin users and Storefront customer accounts.

## Important

This uses the existing Resend backend and existing verified sending domain setup via `RESEND_API_KEY` and `ORDUVA_EMAIL_FROM`. No new Resend domain is required if `updates.orduva.com` is already configured for Orduva email sending.

## SQL

Creates `public.password_reset_tokens` with explicit service_role grants only.
