# Orduva Ver-0.187 — Pricing plans foundation

## Summary

Adds the Starter, Growth and Pro subscription pricing foundation with Africa-first currencies and customer-facing pricing UX.

## Included

- Starter, Growth and Pro plan definitions.
- Product limits:
  - Starter: 25 products
  - Growth: 50 products
  - Pro: 100+ products
- Africa-first currency order:
  - ZAR
  - KES
  - GBP
  - USD
  - EUR
- Monthly pricing in all five currencies.
- Yearly toggle with 20% discount.
- Yearly prices are rounded to the nearest whole number.
- Browser-based currency suggestion for visitors.
- Manual currency selector.
- Store currency selection on the public onboarding form.
- Preferred plan selection on onboarding.
- Trial plan name now records selected plan as `<plan>_trial`.
- Store currency still writes into tenant_settings.currency_code, so referral commission currency continues to default from the referred tenant currency.

## Not included yet

- Stripe Checkout session creation.
- Stripe Price IDs.
- Product limit enforcement in admin.
- Payment provider webhooks.

These are intended for the next Stripe-focused build.
