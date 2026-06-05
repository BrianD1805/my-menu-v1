# Orduva Patch Ver-0.231G — Checkout base price zero fix

This patch fixes ordinary product checkout rows showing 0.00 after the standalone invoice-payment changes.

## Cause

Base product cart lines do not have a variant price. Some cart rows stored `variantPrice: null`. The checkout helper converted `null` with `Number(null)`, which becomes `0`, so it incorrectly preferred zero over the real product price.

## Fix

- Treat `null`, `undefined`, and empty strings as missing numeric values.
- Only use variant/fallback prices when they are genuinely provided.
- Keep normal base product pricing intact.
- Keep standalone invoice payments out of the cart.

## SQL

No Supabase SQL required.
