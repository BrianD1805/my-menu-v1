# Orduva Patch Ver-0.232 — Discount and rewards popup colour controls

## Summary
Adds tenant-configurable colour controls for the storefront discount/offers popup and rewards popup while preserving the existing standard popup shell rules.

## Changes
- Added dedicated theme editor groups for Rewards popup colours and Discount popup colours.
- Added controls for visible popup surfaces including background, top edge, header, header blend, text, cards, borders, pills, progress bar, footer, main button and close button.
- Applied the selected colours to the storefront rewards popup.
- Applied the selected colours to the storefront offers/discount popup.
- Added header blend colours so popup headers can use a soft tenant-controlled gradient.
- Bumped storefront cache version to force fresh theme data.
- Bumped visible version to Ver: 0.232.

## SQL
No Supabase SQL required. These colours are stored inside the existing storefront theme JSON.

## Notes
Existing popup spacing and shell rules are preserved: centred popup, 35px side spacing, 75px top/bottom spacing, sticky header/footer and scroll-contained body.
