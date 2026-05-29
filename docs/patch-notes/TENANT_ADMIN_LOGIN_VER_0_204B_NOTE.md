# Orduva Ver-0.204B — Tenant admin sign-in page upgrade

Scope: tenant admin sign-in page only.

Changes made:
- `/admin/login` now shows a focused Orduva loading panel with "We're getting things ready" while `/api/admin/auth/session` decides whether the tenant admin user is already signed in.
- If already signed in, the page shows only the "Already Signed in" panel with Open admin and Sign out actions.
- If not signed in, the page shows only the email address, password and Sign in button.
- Removed the redundant sign-in tab/button and the owner setup button/panel from the tenant admin login UI.
- Owner/platform sign-in flow was not touched.
- Payment, Stripe, settings and storefront files were not touched.

Supabase SQL: none required.
