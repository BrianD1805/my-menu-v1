# Orduva Patch Ver-0.230A — Admin Forgot Password Public Route Fix

## Summary
Fixed the Tenant/Admin forgot password route so it is treated as a public admin authentication page rather than being redirected back to the admin login screen.

## Touched files
- `middleware.ts`
- `lib/version.ts`
- `docs/ORDUVA_PATCH_LOG.md`

## What changed
- Added `/admin/forgot-password` to the public admin paths.
- Added `/admin/reset-password` to the public admin paths so emailed reset links can open without an existing admin session.
- Preserved all existing protected admin page behaviour.

## Supabase SQL
No new Supabase SQL required. The Ver-0.230 password reset SQL is still required before testing the full email reset flow.
