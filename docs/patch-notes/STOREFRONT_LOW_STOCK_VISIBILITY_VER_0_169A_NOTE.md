# Orduva Ver-0.169A — storefront low-stock visibility polish

This patch refines the customer-facing stock display.

## Included

- Storefront product cards no longer show normal stock levels when stock is above the product Low Stock Warning value.
- Product cards now show `Only X left` only when stock is greater than zero and at/below the Low Stock Warning value.
- Product detail popup follows the same customer-facing stock display rule.
- Favourite cards follow the same customer-facing stock display rule.
- Search result cards follow the same customer-facing stock display rule.
- `Out of stock` still shows when tracked stock reaches zero.

## Not changed

- Admin stock visibility
- Stock reduction on order save
- Checkout stock validation
- Supabase schema
- Product card layout structure
