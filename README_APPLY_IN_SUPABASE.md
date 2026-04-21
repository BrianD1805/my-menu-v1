# Orduva Ver-0.102B — Supabase schema for push subscriptions and notification events

## What this patch adds
- `admin_push_subscriptions`
- `notification_events`

## Apply in Supabase
1. Open Supabase SQL Editor.
2. Paste the migration SQL from:
   - `supabase/migrations/2026-04-21_ver_0_102B_push_notifications_schema.sql`
3. Run it once.
4. Confirm both tables now exist.
5. Retry the admin PWA flow:
   - Enable admin push
   - Check whether `Saved devices` changes from `0` to `1`
   - Run `Send real push test`

## Notes
- This migration assumes your existing tables are:
  - `public.tenants`
  - `public.orders`
- It enables RLS on the new tables.
- It includes service-role full access plus tenant-scoped authenticated read/write policies.
- If your JWT does not currently include `app_metadata.tenant_id`, the authenticated tenant-scoped policies may be too strict.
  In that case, keep service-role writes for now and we can relax/tune the authenticated policies in the next patch.
