# ORDUVA PATCH VER 0.232D — Theme editor workspace and suggested colours polish

## Summary
Refines the Tenant Admin per-item storefront colour editor so desktop colour inputs stay on the left side of the screen, leaving the right side clear for draggable preview and suggested colour windows.

## Changes
- Kept the colour editor controls constrained to the left half of the desktop workspace.
- Added a clear right-hand workspace area for floating preview/suggested colour windows.
- Added a draggable desktop suggested colours window, matching the draggable preview-window approach.
- Improved suggested colour copying with larger rows, selectable hex fields, and explicit Copy buttons.
- Added toast feedback when suggested colours are copied or added.
- Kept mobile behaviour unchanged.

## SQL
No Supabase SQL required.

## Notes
This patch does not change storefront checkout, products, variants, invoice payments, or payment-provider logic.
