# Orduva Ver-0.140A — notification_events logging insert fix

This patch fixes customer status push logging. Ver-0.140 successfully sent customer push notifications, but logging did not appear in `public.notification_events` because the app was inserting a `payload` field while the live Supabase table uses `metadata jsonb NOT NULL`.

## Changes

- Uses `metadata` instead of `payload` for `notification_events` inserts.
- Keeps the working customer status push send path intact.
- Logs sent, skipped, and failed customer status push events.
- Adds processed/failed timestamps where appropriate.
- Updates shared notification enqueue helper to match the live table shape.
- Fixes a duplicate `customerPhone` declaration in the push helper.

No new SQL is required for this patch if the Ver-0.140 SQL was already run.
