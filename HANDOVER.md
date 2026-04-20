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
