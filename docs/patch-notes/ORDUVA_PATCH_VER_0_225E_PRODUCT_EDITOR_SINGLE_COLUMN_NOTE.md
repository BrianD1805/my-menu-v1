# Orduva Patch Ver-0.225E — Product Editor Single Column Polish

## Purpose
Polish the Tenant Admin product editor popup after product variants made the two-column desktop layout too cramped.

## Changes
- Reduced the edit/create product popup maximum desktop width by approximately 25%.
- Removed the desktop split layout inside the popup.
- Moved the formatted product description editor into the main left/product details flow.
- Kept all product editing fields in a single scrollable column so the full popup width can be used.
- Softened the variant row layout so variant fields wrap more comfortably inside the narrower popup.

## Preserved
- Product variant stock foundation from Ver-0.225C.
- Documentation tidy structure from Ver-0.225D.
- Checkout/payment provider logic.
- Product card UI.

## SQL
No Supabase SQL required.
