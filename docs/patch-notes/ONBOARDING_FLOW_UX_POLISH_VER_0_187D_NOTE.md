# Orduva Ver-0.187D — Onboarding flow UX polish

## Summary

Polished the public landing/start-your-store onboarding journey before Stripe wiring.

## Changes

- Removed visible referral-saved message from the landing page.
- Removed non-customer-facing landing wording and admin/login distractions.
- Updated landing copy to be customer-facing.
- Removed plan/currency explanatory panel that was too technical.
- Removed reserved-address explanatory text from the form.
- Removed Stripe/referral commission wording from customer-facing currency/trial text.
- Added explicit “no credit card details” wording.
- Added WhatsApp “same as phone number” checkbox.
- Removed the large pre-submit warning checklist panel; validation still runs on submit.
- Removed Back to Orduva Home / View demo links from the start page footer.
- Added owner password show/hide control.
- Added copy-password control.
- Added server-side duplicate checks for store name and store contact email across public/platform/admin tenant creation routes.

## Supabase

No Supabase SQL required. Checks are server-side in the onboarding APIs.
