# Orduva Ver-0.182 — Referral tracking foundation

Adds the database and onboarding capture layer for tenant referral links.

## Included

- Generic `referral_sources` table for tenant / future affiliate / campaign referrals.
- `referral_signups` table to connect a referred new tenant to a source.
- `/start-your-store` captures `ref_tenant`, `ref_source`, and `ref` from the URL and keeps them in session storage while the signup form is completed.
- Public tenant creation records the referral after the new store is created.
- Platform dashboard now has a Referrals summary card and shows referral activity on store rows.

## Not included yet

- 15% reward ledger/payable calculations.
- Public affiliate sign-up programme.
- Payout/export workflow.
