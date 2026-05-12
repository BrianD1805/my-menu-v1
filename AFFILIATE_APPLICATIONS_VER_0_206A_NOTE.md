# Orduva Ver-0.206A — Affiliate payout currency and target earning region

This patch updates the public affiliate application flow after the Ver-0.206 foundation.

## Added
- Replaces free-text Country with a required payout currency dropdown:
  - ZAR — South African Rand
  - KES — Kenyan Shilling
  - GBP — British Pound
  - USD — US Dollar
  - EUR — Euro
  - AUD — Australian Dollar
  - NZD — New Zealand dollar
- Adds a required country/region dropdown for where the affiliate intends to earn from:
  - South Africa, Kenya, United Kingdom, Europe, United States of America, Australia, New Zealand, Other
- Adds Other region text input when Other is selected.
- Owner Platform affiliate applications and approved partners now show payout currency and target earning region.
- Approved affiliate dashboard now uses the affiliate payout currency for summary cards.
- Adds a warning if commission credits are in a different currency from the payout currency.

## Important
Automatic FX conversion has not been added yet. If a referred tenant pays in a different currency from the affiliate payout currency, manual conversion is still required for now.

## Supabase
Run SUPABASE_VER_0_206A_AFFILIATE_PAYOUT_REGION_FIELDS.sql before deploying this patch.
