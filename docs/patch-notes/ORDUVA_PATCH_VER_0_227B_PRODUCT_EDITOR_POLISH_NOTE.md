# Orduva Patch Ver-0.227B — Product editor save-state polish and second category

## Summary
- Added unsaved-changes confirmation to the Tenant Admin product editor.
- Save button now turns a light red tone when there are unsaved changes.
- Save button keeps showing Creating... / Saving... while the database action is running.
- Added premium toast notifications for add, edit and delete product actions.
- Improved stock controls so stock tracking, stock quantity and low stock warning sit on the same line on desktop where space allows.
- Added an optional second category for products.

## SQL
Requires `supabase/migrations/2026-05-30_ver_0_227b_product_editor_unsaved_second_category.sql`.

## Guardrails
- No checkout logic changed.
- No payment provider configuration changed.
- No product card UI changed.
- No variant stock reduction logic changed.
