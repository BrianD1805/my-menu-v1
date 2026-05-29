# Orduva Patch Ver-0.222C — Formatted receipt PDF sharing

## Summary
Fixes the receipt PDF share/export route so the shared PDF is a designed receipt rather than a plain text list.

## Changes
- Replaces the basic PDF text list generator with a premium styled PDF generator.
- Adds receipt shell, green top edge, header, receipt reference pill, detail cards, item table, totals card and footer note.
- Keeps the browser print/save page unchanged for customers who prefer manual printing.
- Share action now attempts to share the actual PDF file first.
- If native PDF file sharing is unavailable, it downloads the PDF instead of sharing a plain receipt link.
- The printable HTML receipt still shows the tenant logo.
- The generated PDF embeds tenant logo images when the configured logo URL is a fetchable JPEG; otherwise it uses a branded tenant initial badge so the PDF still looks intentional.

## SQL
No Supabase SQL required.
