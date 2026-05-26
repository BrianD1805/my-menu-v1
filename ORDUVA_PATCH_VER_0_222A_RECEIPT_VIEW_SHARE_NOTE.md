# Orduva Patch Ver-0.222A — Receipt view and share polish

## Summary
Small customer account receipt UX polish.

## Changes
- Changed customer order history receipt action from "Download receipt" to "View Receipt".
- Added a compact share icon next to View Receipt for orders with a receipt URL.
- Share uses the native Web Share API where available.
- If native sharing is not available, it copies the receipt link to the clipboard and shows a confirmation message.
- The receipt page still contains the actual download/print action.

## SQL
No Supabase SQL required.

## Version
Ver: 0.222A
