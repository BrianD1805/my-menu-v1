# Orduva Patch Ver-0.222H — Receipt tax rate and PDF polish

## Summary
- Added a tenant Receipt information VAT/GST rate percentage field.
- Added receipt-only VAT/GST display logic without changing storefront prices, checkout totals or payment calculations.
- VAT displays as an included amount in the subtotal/totals section.
- GST displays as a rate line after the Total paid field.
- Polished generated receipt PDF alignment and footer spacing.

## SQL
Run `supabase/migrations/2026-05-27_ver_0_222h_receipt_tax_rate_and_pdf_polish.sql` before testing the new VAT/GST rate field.

## Safety
No payment provider logic, checkout logic or product card UI was changed.
