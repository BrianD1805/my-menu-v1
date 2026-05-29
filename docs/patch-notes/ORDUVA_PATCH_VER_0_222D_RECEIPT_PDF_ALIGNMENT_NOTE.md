# Orduva Patch Ver-0.222D — Receipt PDF alignment polish

## Purpose
Fixes the premium formatted receipt PDF layout reported after Ver-0.222C.

## Changes
- Keeps the PDF payment and fulfilment detail cards inside the same content width as the item table.
- Aligns the left and right receipt detail card grid with the item card/table edges.
- Adds right-aligned PDF amount rendering so item totals, subtotal, discounts and total paid align to the final trailing zero.
- Adds tabular numeric alignment for the online receipt HTML amount columns and totals.
- Bumps the visible Orduva version to Ver: 0.222D.

## SQL
No Supabase SQL required.

## Safety notes
- No payment provider logic was changed.
- No product card UI was changed.
- No receipt data/schema logic was changed.
