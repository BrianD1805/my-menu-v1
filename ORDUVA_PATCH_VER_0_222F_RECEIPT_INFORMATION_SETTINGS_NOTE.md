# Orduva Patch Ver-0.222F — Receipt Information Settings

## Summary
Adds a new Tenant Admin settings section for receipt information and applies the saved settings to the customer receipt HTML/PDF output.

## Included
- New Receipt information section in Tenant Settings.
- Tenant-controlled document name, such as Receipt or Tax Invoice.
- VAT/GST toggle and tax number field.
- Two optional tenant-labelled receipt fields with show/hide tickboxes.
- Long receipt footer message.
- Receipt image selector between store logo and favicon/app icon.
- Compact receipt header so items start higher on the page.
- Receipt order number, tax number and enabled additional fields now appear together in the top header/meta area.

## SQL
Requires the included migration:
`supabase/migrations/2026-05-27_ver_0_222f_receipt_information_settings.sql`

Run the SQL in Supabase before testing/saving the new receipt information fields.

## Not changed
- No payment provider logic changed.
- No product card UI changed.
- No checkout logic changed.
