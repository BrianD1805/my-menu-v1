# Orduva Patch Ver-0.222B — Receipt actions, sharing and logo polish

## Summary
Follow-up polish for customer account receipts.

## Changes
- Moved View Receipt and Share actions to the bottom of each order-history card.
- Replaced the simple arrow share marker with the same connected-node share icon used on product sharing.
- Receipt sharing now attempts to fetch and share a generated PDF file where the browser/device supports native file sharing.
- Added a Share button on the receipt page between Print / save as PDF and Back.
- Renamed customer receipt heading from Premium receipt to Receipt.
- Added tenant logo display to the printable receipt page when a tenant logo is configured.
- Added a PDF response mode using `?format=pdf` for native share-file workflows.

## Notes
The printable receipt page remains the premium visual receipt and includes the tenant logo when the logo URL is configured. Browser/device support for sharing PDF files varies, so the share action falls back gracefully to the receipt link where file sharing is not available.

## SQL
No Supabase SQL required.
