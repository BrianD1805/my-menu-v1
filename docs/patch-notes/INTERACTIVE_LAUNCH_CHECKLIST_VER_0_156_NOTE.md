# Orduva Ver-0.156 — Interactive admin launch checklist with saved progress

This build turns the first-time admin launch checklist into a saved, interactive launch assistant.

## Highlights

- Adds Supabase-backed checklist progress per tenant/store.
- Adds `/api/admin/launch-checklist` for loading and saving progress.
- Checklist can be minimised and maximised on demand.
- Checklist is available across the signed-in admin pages through the shared admin shell.
- Checklist remains available until the store owner explicitly clicks `Everything is done — hide checklist`.
- A completed/hidden checklist can be shown again.
- Checklist items can open the relevant admin area.
- Categories, products, product photos, push setup and test orders auto-tick when Orduva detects them.
- Review-style items can be ticked manually.

## SQL required

Run:

`supabase/migrations/2026-05-04_ver_0_156_tenant_launch_checklists.sql`

before relying on saved checklist progress.
