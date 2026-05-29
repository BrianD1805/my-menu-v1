# Orduva Ver-0.156B — tenant favicon upload fix

This same-thread patch fixes favicon upload handling after the Supabase Storage upload change.

## Fixes

- Accepts favicon `.ico` uploads even when the browser sends an empty MIME type or `application/octet-stream`.
- Infers the correct MIME type from safe image extensions only.
- Keeps Supabase Storage content type valid for `.ico`, PNG, SVG and WebP favicons.
- Adds a visible Favicon URL field and favicon preview in tenant settings, so admins can see exactly what was saved.
- Uses a more specific file picker for favicon uploads.

## SQL

No new SQL is required if the Ver-0.156A `tenant-assets` Supabase Storage SQL has already been run.
