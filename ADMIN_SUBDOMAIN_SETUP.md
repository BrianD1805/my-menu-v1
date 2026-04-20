# Orduva Admin Subdomain Setup

## Goal
Use a shared admin host such as `admin.orduva.com` for the seller/admin app, while storefront tenants continue to use tenant subdomains such as `zimza.orduva.com`.

## What this patch does
- Redirects `/admin` and `/api/admin` traffic from non-admin hosts to the configured admin host when `ADMIN_HOSTNAME` is set.
- Redirects the shared admin host root `/` to `/admin/login`.
- Keeps tenant selection on the admin login form via tenant slug.

## Environment variables
Add these in Netlify and in `.env.local`:

```env
ADMIN_HOSTNAME=admin.orduva.com
NEXT_PUBLIC_ADMIN_HOSTNAME=admin.orduva.com
```

## Netlify domain wiring
1. Open the site in Netlify.
2. Go to **Domain management**.
3. Add `admin.orduva.com` as a custom domain to the same site.
4. In your DNS provider, create a CNAME for `admin` pointing to the Netlify target shown in Netlify.
5. Wait for SSL to provision.

## Test flow
1. Visit `https://admin.orduva.com`.
2. Confirm it redirects to `/admin/login`.
3. Enter tenant slug `orduva` and sign in.
4. Confirm admin pages stay on `admin.orduva.com`.
5. From a storefront host, open `/admin/login` and confirm it redirects to the admin host.
