# Orduva Ver-0.156A — Tenant Logo and Favicon Uploads via Supabase Storage

This patch fixes tenant logo and favicon uploads for production hosting.

The old upload route wrote files into `public/tenant-assets/<store>/`, which can appear to work locally but is not reliable on Netlify because runtime file writes do not become permanent deployed assets.

## Change

`/api/admin/upload-tenant-asset` now uploads logo/favicon files into the Supabase Storage bucket:

```text
tenant-assets
```

It then saves the public URL directly into:

```text
public.tenant_settings.logo_url
public.tenant_settings.favicon_url
```

## Required Supabase setup

Run the included migration once:

```text
supabase/migrations/2026-05-04_ver_0_156A_tenant_assets_storage.sql
```

This creates/updates a public Supabase Storage bucket called `tenant-assets` and allows public read access for storefront display.

## Notes

Allowed image types:

```text
PNG, JPG, WebP, SVG, ICO
```

Limits:

```text
Logo: 3MB
Favicon: 1MB
```
