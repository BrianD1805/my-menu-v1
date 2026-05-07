# Orduva Ver-0.176 — Trial status visibility

Adds trial countdown visibility without blocking storefronts.

## Admin visibility

- Tenant admin pages now show a compact Orduva trial banner below the admin header.
- The banner displays days remaining, trial end date, plan name, and a small progress bar.
- Expiring trials and expired trials use different warning tones.
- The banner explicitly states that there is no storefront blocking yet.

## Owner/platform visibility

- Owner store readiness dashboard now includes trial summary counts:
  - active trials
  - expiring soon
  - expired trials
- Each store row now includes a trial status pill and trial end date.
- Priority check includes trial status.

## Behaviour

- No storefront blocking added in this build.
- No payment provider integration added in this build.
- No Supabase SQL required if Ver-0.175 SQL has already been run.
