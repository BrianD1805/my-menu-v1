# Orduva Ver-0.182A — onboarding email warning fix

- Removed the live amber onboarding warning for email fields.
- Removed the red email-field styling while typing.
- Onboarding is no longer blocked by the warning panel before submit.
- Email validation now happens only when creating the store and only checks a simple `name@example.com` shape.
- Contact email may be left blank.
- Owner email still remains required when creating an owner login.
- No Supabase SQL required.
