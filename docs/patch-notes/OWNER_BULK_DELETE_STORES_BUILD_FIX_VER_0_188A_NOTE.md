# Orduva Ver-0.188A — Owner bulk delete build fix

Fixes the TypeScript build error in `app/api/platform/stores/delete/route.ts` where optional referral signup IDs were concatenated before filtering.

## Change

- Filters referred referral signup IDs with `uniqueIds()` before concatenating into the `signupIds` array.
- Bumps visible/cache version to Ver: 0.188A.

## Supabase SQL

No Supabase SQL required.
