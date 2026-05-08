# Orduva Ver-0.186 — referral dashboard polish and summary totals

This patch polishes the owner referral dashboard at `/platform/referrals`.

## Changes

- Adds clearer top summary cards for referring tenants, referred stores, active rewards, monthly liability, pending credits, paid credits, trial, paused, and cancelled rewards.
- Adds multi-currency summary support so GBP/ZAR/KES totals are shown separately instead of being merged into one misleading amount.
- Adds paid-credit filtering.
- Adds a selected-view summary showing how many referral records and referring tenants are currently visible.
- Keeps the referring tenant as the lead title on each referral card.
- Keeps monthly payment recording and automatic referral credit creation from Ver-0.185.
- Keeps the session isolation changes from Ver-0.185B intact.

## SQL

No Supabase SQL required.
