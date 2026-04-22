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


## Ver-0.104
- Changed orders into focused status views so each status card lands directly in that status list.
- Added a proper order detail viewer popup instead of cramming full contents into the main card.
- Kept order cards compact with View order plus status controls.


## Ver-0.104A
- Changed status cards so they open the order queue popup directly.
- New, Accepted, Preparing, Out for delivery, and Delivered now open their orders immediately in a popup working queue.
- The queue popup includes status controls and a separate View order detail viewer.


## Ver-0.104B
- Fixed the order queue popup runtime bug by changing `label.lower()` to `label.toLowerCase()`.


## Ver-0.105
- Improved order queue popup UX on desktop and mobile.
- Centered the popup and increased bottom padding around the last order card.
- Stopped background page scrolling while the queue popup is open.
- Replaced the inline status dropdown with a popup-style status selector, matching desktop and mobile.


## Ver-0.106
- Added customer push notification foundation on the storefront success page.
- Added customer push subscription save/test API routes.
- Added storefront service worker push handlers.
- Added customer push delivery on admin order status changes.
- Added Supabase migration for customer_push_subscriptions.


## Ver-0.107
- Added live customer order-status push delivery for accepted, preparing, out for delivery, and delivered.
- Customer pushes are now sent to subscriptions saved against the order when the admin updates status.


## Ver-0.108
- Changed customer push subscription saving toward reusable device-level registration.
- Customer push subscriptions now upsert by tenant + endpoint instead of order + endpoint.
- Added Supabase migration for tenant + endpoint unique index.


## Ver-0.108A
- Completed reusable customer push linkage across new orders.
- Customer device registrations now save by tenant + endpoint and relink the current order automatically.
- The current order can now reuse an already-saved customer device instead of starting from zero again.


## Ver-0.108A FIXED
- Fixed customer push type reference in lib/web-push.ts by using the existing CustomerSubscriptionRow type name.


## Ver-0.108A FIXED2
- Fixed customer push build error in lib/web-push.ts by removing the unsupported `enabled` property from the buildSubscription object literal.


## Ver-1.108B
- Fixed customer push recipient lookup across reused orders.
- Status pushes now try direct order linkage first, then same customer phone within tenant, then same customer name within tenant.
- Reusable customer device saving remains tenant + endpoint based.


## Ver-0.108C
- Fixed app/api/admin/orders/[id]/route.ts to call sendCustomerPushForOrderWithFallback instead of the removed sendCustomerPushForOrder helper.
- Reset visible version label to Ver: 0.108C as requested.


## Ver-0.108D
- Fixed duplicate `CustomerSubscriptionRow` type declaration in `lib/web-push.ts`.


## Ver-0.108E
- Fixed reusable customer push reuse and order lookup properly.
- The customer push test now uses the same fallback lookup as live status pushes.
- The success page now silently relinks a new order to the already-saved customer device when permission and subscription already exist.
- Active customer devices now count unique endpoints, not duplicate rows.


## Ver-0.109
- Added customer account foundation with signup, login, logout, and a basic account page.
- Added cookie-based customer session helper.
- Added Supabase migration for customer_accounts.
- This foundation prepares future builds for account-linked push subscriptions and customer order history.


## Ver-0.110
- Connected customer login into the storefront and checkout flow.
- Added a storefront account status block with login/signup/account/sign out entry points.
- Checkout now recognises a signed-in customer and marks the order to link to that customer account.
- Added orders.customer_account_id groundwork for future account-linked push, order history, and saved details.


## Ver-0.110A
- Fixed the checkout syntax error caused by customerAccountId being inserted into the useState declaration for customerPhone.
- Kept customerAccountId in the order submit payload where it belongs.


## Ver-0.110B
- Repaired the malformed checkout state declaration for customerPhone/customerAccountId.
- Scanned TypeScript files for the same accidental insertion pattern and cleaned any matches.


## Ver-0.110C
- Fixed accidental JSX fragment wrappers inserted into checkout return blocks, which caused `Expression expected` build errors.


## Ver-0.110D
- Restored the missing `customerAccount` / `setCustomerAccount` state hook in checkout so the customer account prefill effect can compile correctly.


## Ver-0.110E
- Fixed storefront customer account links/navigation by switching the visible account actions to explicit Next Link navigation.
- Login now targets /account/login and Create account now targets /account/signup reliably.


## Ver-0.110F
- Moved customer account actions into the live storefront header to fix stagnant / non-clickable account buttons.
- Desktop: account icons now sit inline in the header row next to search and cart.
- Mobile: account icons now sit on the left side of the header with search and cart remaining on the right.


## Ver-0.110G
- Repaired the malformed MenuBrowser header JSX block introduced during the storefront account header icon move.
- Restored proper closing structure before the welcome section so the storefront build can parse again.


## Ver-0.110H
- Fixed the MenuBrowser JSX structure properly by removing the stray brace before the main return block and re-stabilising the header action area.


## Ver-0.110J
- Fixed the real MenuBrowser header parse issue by restoring the missing closing `</div>` tags before the welcome section.


## Ver-0.110K
- Fixed the final missing closing brace in `components/menu/MenuBrowser.tsx` that caused the `Expected '}', got '<eof>'` build error.


## Ver-0.110L
- Fixed the extra closing brace at the end of `components/menu/MenuBrowser.tsx` so `MenuBrowser` returns JSX again instead of compiling as `void`.


## Ver-0.110M
- Fixed the actual lingering parse break in `components/menu/MenuBrowser.tsx` by restoring the missing closing brace on `addToCart(productId)` before the component return block.


## Ver-0.110N
- Fixed customer logout so it redirects back to the storefront instead of showing raw JSON.
- After login/signup, customer auth now returns the user to the storefront so the signed-in header state is immediately useful.
- Added a back-to-storefront path from the account page and kept header/account sign-out wired to redirect cleanly.
