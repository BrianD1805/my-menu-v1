# Orduva Ver-0.146C — public automated client onboarding

This same-thread patch corrects the public onboarding flow.

## Intent

Clients should not be sent to `/platform/onboarding` and should not need an onboarding code.

## Public client flow

Clients now start from:

```text
https://www.orduva.com/#client-onboarding
```

They complete the public form and Orduva automatically creates:

- tenant/store record
- default tenant settings
- starter Menu category
- owner login
- generated store address

## Owner platform flow

The owner platform remains separate at:

```text
https://www.orduva.com/platform/onboarding
```

That route remains protected by the platform access key and keeps the owner multi-store overview.

## Technical notes

- Public homepage onboarding now posts to `/api/public/tenants`.
- Public API requires owner name, owner email and password.
- Public API keeps duplicate store-address checks and reserved store-address checks.
- A hidden honeypot field is included as a light first-pass bot/spam guard.
- No payment/free-trial gating has been added yet.
