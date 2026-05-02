# Orduva Ver-0.143 — Active Tenant Identity Display in Admin

## Purpose

This patch makes the active tenant context obvious throughout the shared Orduva admin app, especially now that `admin.orduva.com/admin` is used as a shared admin workspace for multiple tenants.

## What changed

- Bumped `LIVE_VERSION` to `Ver: 0.143`.
- Added a prominent dark **Active tenant** identity bar above the admin header.
- The identity bar shows:
  - active tenant display name
  - active tenant slug / storefront subdomain
  - current app version
  - a direct **Open storefront** action
- The identity bar uses the tenant logo when available, otherwise it falls back to the tenant initial.
- The admin session card now also shows the tenant slug.
- The footer storefront button now opens the active tenant storefront URL directly.
- All tenant admin pages now pass the resolved `tenant.slug` into `AdminShell`.

## Files touched

```text
components/admin/AdminShell.tsx
app/admin/page.tsx
app/admin/orders/page.tsx
app/admin/products/page.tsx
app/admin/categories/page.tsx
app/admin/settings/page.tsx
lib/version.ts
ADMIN_ACTIVE_TENANT_IDENTITY_VER_0_143_NOTE.md
```

## Not touched

```text
Wildcard tenant routing
Platform onboarding flow
Storefront product card UI
Push notification logic
Customer accounts/order linkage
Advanced theme editor logic
Supabase schema
```

## Supabase SQL

No Supabase SQL required.

## Testing checklist

After deploying, open:

```text
https://admin.orduva.com/admin
```

Confirm:

```text
1. The top of the admin clearly says Active tenant.
2. The tenant name is visible.
3. The tenant slug/subdomain is visible.
4. The version shows V 0.143.
5. Open storefront opens the correct tenant storefront in a new tab.
6. Orders, Products, Categories and Settings still show the same active tenant bar.
```

Suggested test tenants:

```text
https://stamps-delivered.orduva.com
https://test-cafe.orduva.com
https://zimzaexpress.orduva.com
```
