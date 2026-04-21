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


## Ver-0.100A
- Restored storefront PWA installability groundwork.
- Added dedicated storefront service worker registration on the storefront.
- Added dedicated storefront install icons in 192 and 512 sizes.
- Strengthened storefront manifest with explicit id, start_url, scope, and valid icon entries.


## Ver-0.100C
- Clean storefront/admin baseline rebuild prepared from the current live project folder.
- Visible storefront version bumped to Ver: 0.100C so deployment integrity can be verified immediately on desktop and mobile.
- Shared admin subdomain architecture files preserved in the baseline.
- Use this build to confirm the storefront is actually updating before further PWA work.


## Ver-0.101
- Added admin push notification foundation card inside admin home.
- Added admin service worker push handlers and notification click routing.
- Added API route to save and disable admin push subscriptions per tenant.
- Added notification event queue foundation for admin and customer order events.
- Added customer notification journey block on the checkout success screen.
- Added starter schema entries for admin push subscriptions and notification events.


## Ver-0.101A
- Added a visible admin version label in the admin shell header so live admin testing can be confirmed quickly.
- Bumped live version display to Ver: 0.101A.


## Ver-0.102
- Added live admin web push delivery wiring for new orders.
- Added admin real push test endpoint and button.
- Added web-push dependency and VAPID env placeholders.
- New orders now attempt immediate real push delivery to active admin subscriptions for the current tenant.
- Customer notification flow remains staged in the database for the next build.


## Ver-0.102 FIXED2
- Added local TypeScript declaration for `web-push` to fix missing module type errors during build.


## Ver-0.102A
- Fixed admin push registration flow to give clearer status feedback during device registration.
- Added post-registration status refresh so Saved devices updates immediately after enable.
- Bumped live version to Ver: 0.102A.


## Ver-0.102C
- Fixed admin push subscription save path to match the Supabase schema added in Ver-0.102B.
- Fixed admin push queries to use enabled/p256dh/auth columns.
- Improved error reporting on Enable admin push so save failures are shown clearly.
- Added clearly visible admin version labels in the push card and admin header.


## Ver-0.102D
- Hardened admin install branding isolation on the shared admin subdomain.
- Root metadata now returns Orduva Admin on the admin host, not storefront branding.
- Root manifest route now returns the admin manifest on the admin host to stop storefront name/icon bleed during install.
- Middleware now marks all admin-host requests as admin route kind for stronger metadata isolation.


## Ver-0.102E
- Added a little more bleed space around the admin favicon/icon artwork so the letters do not sit too tight to the edge on installed app and notification surfaces.


## Ver-0.102F
- Removed the remaining white fringe around the admin icon edges while keeping the improved bleed space around the letters.


## Ver-0.102G
- Restored the white "Ord" lettering in the admin icon.
- Removed only the unwanted white fringe connected to the outer edge of the icon.
- Kept the improved bleed space around the letters.


## Ver-0.102H
- Replaced the admin icon/favicon assets throughout the admin app with the newly supplied icon.
- Updated admin install icon files and apple touch icon so the new artwork is used consistently.
- Bumped live version to Ver: 0.102H.


## Ver-0.102I
- Switched off automatic WhatsApp order handoff on checkout success.
- Added a small manual WhatsApp send button on the success page.
- This avoids the lingering WhatsApp web/app chooser screen staying open in the background.


## Ver-0.103
- Made order status info cards open filtered orders for New, Accepted, Preparing, Out for delivery, and Delivered.
- Moved View storefront and Logout to the bottom of the admin shell.
- Delivered orders are treated as finalised/archived in the default live view but still counted in Total orders.
- Removed the Save button for completed/delivered orders.
- Fixed visible order contents by reading order_items correctly and showing a clear order summary on each order card.


## Ver-0.103 FIXED
- Fixed Next.js app router `searchParams` typing on admin orders page so production build passes.
