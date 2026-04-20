Orduva Ver-0.077 handover

Included in this patch:
- smaller desktop product title text
- storefront add button text changed to "Add"
- applied on cards, details popup, and search results


## Ver-0.098 — Admin/PWA install support / phone-first admin experience
- Added admin install/help card inside admin home.
- Added dedicated admin PWA manifest and installable admin icons.
- Added phone-first mobile bottom navigation for admin pages.
- Added extra safe-area spacing to support installed phone use.


## Ver-0.098A
- Fixed separate storefront and admin PWA identities so both can be installed independently.
- Added explicit manifest ids, scopes, and start URLs for storefront and admin.
- Replaced the admin install icon with the supplied full-circle Orduva icon.
- Corrected admin metadata so install branding stays on Orduva Admin instead of inheriting storefront branding.


## Ver-0.098B
- Prepared Orduva for a shared admin subdomain architecture instead of tenant-admin subdomains.
- Admin login and first-owner setup now accept an explicit tenant slug.
- Added an admin tenant cookie so the shared admin domain can stay tied to the chosen tenant after login.
- Admin API tenant resolution now follows the authenticated tenant session instead of relying only on the current host.


## Ver-0.098C
- Hard-fixed admin PWA identity metadata with a stronger dedicated admin manifest id.
- Added explicit admin head tags so admin pages keep the Orduva Admin favicon and manifest.
- Added a dedicated admin service worker registration to improve installability on /admin.
- Tightened admin install guidance to warn about removing old installs before reinstalling.


## Ver-0.098D
- Reduced storefront PWA metadata bleed into admin pages by marking admin requests in middleware and returning admin-specific root metadata on admin routes.
- Hard-set admin install name to Orduva Admin, with admin-only icon/head metadata.
- Changed admin start URL to the admin login route to avoid storefront launch fallback after install.
- Kept the shared admin subdomain direction intact without touching locked storefront product card UI.


## Ver-0.099
- Prepared the app for a shared admin subdomain such as `admin.orduva.com`.
- Added `ADMIN_HOSTNAME` / `NEXT_PUBLIC_ADMIN_HOSTNAME` support.
- Updated tenant host resolution so the shared admin host does not get mistaken for a tenant slug.
- Updated admin login guidance so the tenant slug is entered explicitly on the shared admin host.
- This is deployment prep only. Storefront tenant subdomains remain separate and are not reassigned by this patch.


## Ver-0.100
- Added shared admin host redirects using `ADMIN_HOSTNAME`.
- Added root redirect from the admin subdomain to `/admin/login`.
- Added admin subdomain setup instructions for Netlify and DNS.
