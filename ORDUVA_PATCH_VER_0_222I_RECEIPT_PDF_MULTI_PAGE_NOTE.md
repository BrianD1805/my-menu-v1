# Orduva Patch Ver-0.222I — Receipt PDF multi-page layout

## Purpose
Fix generated receipt PDFs where long orders with many products could cause the totals panel/footer to overlap item rows or sit incorrectly on the page.

## Changes
- Removed the fixed single-page item cap in the generated receipt PDF.
- Added proper multi-page PDF generation for receipts with many products.
- Added continuation page headers for longer receipts.
- Moved totals and footer onto the correct final page, creating another page if there is not enough space.
- Added centred page numbering at the bottom, only when the generated PDF has more than one page.
- Preserved the Ver-0.222H VAT/GST display logic without changing storefront prices, checkout totals or payment logic.

## SQL
No Supabase SQL required.

## Test focus
- Generate a PDF receipt with a short order and confirm there is no page number.
- Generate a PDF receipt with many items and confirm it paginates cleanly.
- Confirm totals only appear after the final item row.
- Confirm footer message does not overlap the table or totals.
