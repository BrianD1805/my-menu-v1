## Ver-0.254 - Product details popup UX polish

- Mobile only: removed the Back to menu button from the product details popup footer because the close icon is already available.
- Mobile and desktop: added the Share product button with share icon into the footer action row, directly to the left of the Add/Pre-order button.
- Removed the larger share section that previously appeared above the product description.
- Mobile only: reduced the product details popup image height by about 35%.
- Mobile and desktop: kept stock/pre-order ribbon messaging on the same row as the price where space allows.
- Mobile only: moved the product title down slightly and allowed the title area to use the full row with right padding so it avoids the cart and close buttons.
- No Supabase SQL required.

## Ver-0.253a — Push notification settings UX and device registration fix

- Moved Push notifications into the normal Store settings dropdown flow as its own collapsible section instead of a standalone panel above settings.
- Changed Push notifications to a single-column layout with Store Admin push controls first and customer order-flow push wording/status controls underneath.
- Added a bottom Save push notifications button with the same red unsaved-state flow used by other Store settings sections.
- Added Store Admin device registration controls inside the Push notifications section so allowed browser permission can be converted into a saved push subscription for the current store.
- Improved the no-subscription error wording to explain that notification permission alone is not enough; the admin device must be enabled/saved for that store.
- No Supabase SQL required beyond the existing Ver-0.253 push notification settings table.


## Ver-0.250A — PayFast per-item settings build fix

- Fixed the Tenant Admin per-item colours settings route so it passes the new PayFast fields into the shared TenantSettingsForm initial state.
- Added PayFast merchant key/passphrase secret summary lookup on the per-item colours settings page.
- No database changes beyond the existing Ver-0.250 PayFast SQL migration.

## Ver-0.250 — PayFast ZAR storefront payments

- Added PayFast as an online payment gateway option for South African ZAR stores.
- Added Store Admin Settings controls for PayFast Merchant ID, Merchant Key, optional security passphrase, Test/Live mode, setup notes and checkout visibility.
- Added PayFast redirect, return, ITN webhook and checkout-status routes using the existing pending-payment-intent pattern so orders are created only after PayFast confirms payment.
- Added PayFast success, cancel and error checkout pages.
- Updated storefront checkout payment options so PayFast appears first for configured ZAR stores, followed by Ozow and Yoco.
- Added Supabase SQL for PayFast tenant settings fields and PayFast payment intent references.

## Ver-0.249A — Ozow settings visibility fix

- Patch type: touched-files-only ZIP.
- Added the missing Ozow customer payments card into the visible Storefront payment options / Online payment providers section.
- Added Ozow SiteCode, Private Key, optional API Key, mode, account label, notes, readiness checklist and checkout visibility toggles to the Store Admin Settings UI.
- No additional Supabase SQL required beyond the Ver-0.249 Ozow SQL migration.

## Ver-0.249 — Ozow ZAR storefront payments

- Added Ozow as an online payment gateway option for South African ZAR stores.
- Added Store Admin Settings controls for Ozow SiteCode, Private Key, optional API Key, mode, setup notes and checkout visibility.
- Added Ozow redirect, return, webhook and checkout-status routes using the existing pending-payment-intent pattern so orders are created only after paid confirmation.
- Added Ozow success, cancel and error checkout pages.
- Updated storefront checkout payment options so Ozow appears before Yoco for configured ZAR stores.
- Added Supabase SQL for Ozow tenant settings fields and Ozow payment intent references.

## Ver-0.248 — Store Admin sales overview defaults

- Added Daily, Weekly and Monthly sales overview cards to the Store Admin home page above the main admin panels.
- Added browser-saved default display controls so the store owner can choose which sales figures appear on the home page.
- Sales totals use existing order totals and exclude cancelled/refunded/failed orders without changing checkout, payment, stock or receipt logic.
- Bumped the app version to Ver-0.248.


## Ver-0.247E — Storefront padding mock panel sizing fix

- Made the padding mock panel smaller so left/right/top/bottom controls fit neatly inside the card.
- Standardised all four px input controls to the same fixed size.
- Improved spacing around the mock panel without changing storefront rendering logic.


## Ver-0.246 — Theme presets logo colour controls

- Added actual logo-palette hex colours with square colour swatches in Theme presets.
- Added selectable logo colour roles: Main, Popup top effect, and Loading screen.
- Main logo colour now regenerates the storefront colour theme without letting one colour flood every surface.
- Popup top effect colour is applied to storefront popup top accents.
- Storefront loading/preparing splash now uses the selected logo colour where available.
- Patch type: touched-files-only ZIP.

## Ver-0.245 — Order update notification wording and desktop registration fixes

- Clarified the storefront order updates popup so customers understand notifications are per device and that a previously allowed phone can also receive updates.
- Enlarged the order updates popup by roughly 15% and increased available height to avoid unnecessary desktop scrolling.
- Added safer push subscription retry handling for stale desktop browser registrations, replacing raw push-service errors with customer-friendly wording.
- Updated the checkout order-updates card with the same per-device wording and retry handling.
- Forced the checkout confirmation screen to scroll to the top after an order is placed so it no longer renders halfway down the page.
- No Supabase SQL required.

# Orduva Patch Log

## Ver-0.244 — Storefront popup cart animation and policy footer links

- Raised the add-to-cart flying product animation layer so Favourites and Buy Again popup add buttons show the same visible movement to the popup cart button as the product details popup.
- Kept the Favourites and Buy Again popup layout unchanged.
- Moved store policy links to the storefront contact/footer panel underneath the contact icons.
- Removed the store policy links from the Orduva affiliate/referral footer block so affiliate links stay separate from store policies.
- No Supabase SQL required.

## Ver-0.243A — Tenant admin popup close icon and billing wording fixes

- Re-anchored Tenant Admin popup close icons to the right-hand side using the shared popup rule set.
- Updated the Active Billing / Trial details wording to remove store-owner-facing Stripe references.
- Reduced heavy font weights in the billing popup detail cards and step titles.
- Simplified currency options to show currency codes only, for example ZAR instead of ZAR South Africa.
- Removed the “No Stripe subscription is linked yet...” billing status message from the popup.
- No Supabase SQL required.

## Ver-0.239A — Admin toast contrast correction

- Corrected admin toast contrast after Ver-0.238N/0.239 carried dark toast text into the visible UI.
- Toasts now use a blue admin background, orange border accent, and forced white text/icon/close colours.
- Kept this patch scoped to toast presentation and version references only.

## Ver-0.239 — Storefront favourites and Buy Again popup panels

- Changed storefront Favourites and Buy Again from inline page sections into popup panels.
- Preserved the existing Favourites and Buy Again section/card layout inside each popup.
- Added only a top-right close icon to each popup.
- Locked background scrolling while either popup is open.
- No SQL required.

## Ver-0.238M — Logo palette and toast colour correction

- Reworked the uploaded-logo colour extraction so the generated logo palette prioritises actual visible logo colours, including vivid red/yellow/green/blue and meaningful dark tones, while ignoring white/background noise.
- Updated the Logo palette preset swatches to display the extracted logo colours instead of only the derived theme core colours.
- Kept the generated preset review-and-save flow unchanged.
- Changed Tenant Admin toast notifications to the requested #336699 background with white message text and white close icon.
- Matched product-manager admin toast styling to the same #336699 notification standard.
- No Supabase SQL required.


## Ver-0.238L — Desktop per-item colours window polish

- Fixed the desktop Theme Preview Window border/corner treatment and removed the helper drag text from its header.
- Changed Per-item storefront colour dropdowns so opening one panel no longer closes the previously opened panel.
- Added a 2px black border and stronger corner treatment to the desktop Suggested Colours window.
- Set Suggested Colours to display two colour entries per row on desktop.
- Squared off the suggested colour copy controls so they no longer use circular icon edges.
- Constrained the draggable Theme Preview and Suggested Colours windows to the colour editor container.
- Left-aligned the Preview and Suggested buttons inside each expanded dropdown panel.
- No Supabase SQL required.

## Ver-0.238J — Admin settings container/dropdown panel balance

- Restored the main Settings container to white with a soft shadow.
- Kept blue only on the inner dropdown section panels so they separate cleanly.
- Changed open panel/data content areas to white to avoid blue-on-blue styling.
- Changed the mobile admin menu background back to white.
- Removed the Per-item colours preview workspace wording and blue placeholder panel.
- No Supabase SQL required.

## Ver-0.232D — Theme editor workspace and suggested colours polish

- Constrained the desktop per-item storefront colour controls to the left half of the settings workspace.
- Left the right half clear for the draggable preview window.
- Added a draggable desktop suggested colours window.
- Made suggested colours easier to copy with selectable hex fields and explicit Copy buttons.
- No Supabase SQL required.


## Ver-0.232C — Theme preview window correction

- Replaced the always-visible floating theme preview with a desktop-only draggable preview window.
- The preview is launched only from the Per-item storefront colours editor.
- Added close/collapse controls and kept mobile preview behaviour unchanged.
- No Supabase SQL required.

## Ver-0.229I — Owner Platform Stability and PWA Cache Fix
- Removed dynamic page caching from the Owner Platform service worker.
- Cleared stale Owner Platform PWA caches that could show skeleton/blank platform pages.
- Changed Owner Platform mega menus to click-open to avoid incorrect hover/highlight behaviour.
- No SQL required.


## Ver-0.229H — Owner Platform PWA Install Fix
- Added a dedicated static Owner Platform manifest.
- Added a dedicated Owner Platform PWA registrar.
- Rebuilt favicon/PWA icons from the supplied artwork without altering the white canvas.
- Updated service worker/cache version and install guidance.
- No SQL required.

This is the rolling patch log for the Orduva SaaS Ordering project.

Going forward, patch notes should be added here instead of creating more root-level Markdown files. Detailed older notes have been moved into `docs/patch-notes/` to keep the project root tidy.

## Current documentation structure

- `README.md` remains in the project root.
- `HANDOVER.md` remains in the project root.
- Historical patch notes live in `docs/patch-notes/`.
- This rolling log lives at `docs/ORDUVA_PATCH_LOG.md`.

## Documentation rule from Ver-0.225D onward

For each new Orduva patch:

1. Add a concise entry to this rolling patch log.
2. Only create a separate Markdown note when the patch genuinely needs a detailed handover, operational checklist, or SQL reference.
3. If a separate note is needed, place it in `docs/patch-notes/`, not in the project root.
4. Keep the root folder clean so the app files are easier to browse.

## Patch entries

### Ver-0.225D — Documentation tidy and rolling patch log

**Purpose:** Clean up the project root by moving historical Markdown patch notes into an archive folder and starting a single rolling Orduva patch log.

**Changes:**

- Created `docs/patch-notes/`.
- Moved historical root-level Markdown notes into `docs/patch-notes/`.
- Kept `README.md` and `HANDOVER.md` in the project root.
- Created this rolling patch log at `docs/ORDUVA_PATCH_LOG.md`.
- Bumped visible version to `Ver: 0.225D`.

**No app behaviour changed:**

- No storefront logic changed.
- No Tenant Admin logic changed.
- No checkout logic changed.
- No payment provider logic changed.
- No product variant logic changed.
- No database schema changed.

### Ver-0.225C — Product variants stock foundation

**Purpose:** Rework product variants so each sellable option can have its own final price, description, active state and stock handling.

**Key points:**

- Variant popup follows the Orduva premium popup spacing rules.
- Customers can still select the standard/base product without the tenant duplicating it as a variant.
- Variant stock can be tracked separately.
- Sold-out variants are disabled in the variant picker.
- Checkout/order creation validates and reduces stock for the selected sellable option.

### Ver-0.225B — Variant popup standard product polish

**Purpose:** Add the standard/base product as a selectable option in the variant popup and bring the popup closer to the Orduva standard popup shell.

### Ver-0.225A — Product variants final price polish

**Purpose:** Replace confusing price adjustments with final variant prices and add optional variant descriptions.

### Ver-0.225 — Product variants foundation

**Purpose:** Initial product variant foundation for tenant products and customer add-to-cart selection.

### Ver-0.224A — Tenant Admin toast build fix

**Purpose:** Fix TypeScript timer typing for Tenant Admin toast notifications.

### Ver-0.224 — Tenant Admin toast notifications

**Purpose:** Add premium top-right toast notifications for selected Tenant Admin database/upload actions.

### Ver-0.223A — Canonical URL help text

**Purpose:** Add tenant-friendly explanatory text under the SEO Canonical URL field.

### Ver-0.223 — Storefront SEO and tracking

**Purpose:** Add Tenant Settings SEO fields, Google Analytics/Ads tracking ID, Google Tag Manager ID, structured data support and tenant favicon handling.

### Ver-0.222I — Receipt PDF multi-page layout

**Purpose:** Improve receipt PDFs for orders with many products, including multi-page layout and page numbers only when more than one page exists.

### Ver-0.222H — Receipt tax rate and PDF polish

**Purpose:** Add VAT/GST rate display logic for receipts without changing storefront or checkout totals.

### Ver-0.222F to Ver-0.222G — Receipt information settings and build fix

**Purpose:** Add tenant-controlled receipt fields and fix the settings form type path.

### Ver-0.222C to Ver-0.222E — Receipt PDF alignment and hydration fixes

**Purpose:** Improve formatted receipt PDF sharing/alignment and fix storefront hydration cache mismatch.

### Earlier historical patches

Detailed historical notes for earlier builds are archived in `docs/patch-notes/`.

## Ver-0.225E — Product editor single column polish

- Reduced Tenant Admin product editor popup desktop width by approximately 25%.
- Removed the internal two-column split in the product editor popup.
- Moved formatted description into the main product details flow.
- Adjusted variant editor rows to wrap more comfortably in the narrower popup.
- No Supabase SQL required.

## Ver-0.226 — Stripe success recovery, paid order wording and variant payload cleanup

- Stripe success page now waits for a confirmed paid order before stopping polling and clearing the cart.
- Stripe checkout-status can recover a paid Checkout Session directly from Stripe if the webhook is delayed.
- WhatsApp messages for paid orders now show the correct payment wording and payment reference.
- Final-price variants no longer rely on the legacy `variant_price_delta` value for new cart/order payloads.
- Paid provider stock reduction paths now support variant-level stock.
- No Supabase SQL required.


## Ver-0.226A — Stripe success timer build fix

- Fixed a TypeScript build error in the Stripe success recovery client where the browser timeout handle was typed as a Node timeout.
- Preserved the Ver-0.226 Stripe success recovery, paid order wording and variant payload cleanup behaviour.
- No Supabase SQL required.

## Ver-0.226B — Daraja paid-order reference build fix

- Fixed a TypeScript build error in `lib/storefront-daraja.ts` after the Ver-0.226 paid order wording work.
- Added the optional `paymentReference` field to the Direct M-Pesa/Daraja paid-order helper input type so the shared paid-message reference logic compiles cleanly.
- Preserved Ver-0.226 Stripe success recovery, paid order wording, and variant payload cleanup.
- No Supabase SQL required.


## Ver-0.226C — Stripe paid cart clear fix

- Fixed the final remaining Stripe paid-order issue where the success page confirmed payment but the storefront cart could remain uncleared.
- Stripe checkout status now reads the tenant slug safely whether the stored payment payload is returned as JSON or as a string.
- Stripe success page now clears the confirmed tenant cart and also safely clears any Orduva cart keys on the same storefront origin as a fallback.
- Preserved Ver-0.226 paid-order recovery, variant stock reduction and paid WhatsApp wording fixes.
- No Supabase SQL required.


## Ver-0.226D — Stripe paid intent order recovery fix

- Fixed an edge case where a Stripe payment intent could be marked `paid` before the Orduva order was created and linked.
- Stripe checkout status now creates the missing paid order before returning a confirmed order to the success page.
- Variant stock reduction is preserved because the paid order creation path now runs before the success page is allowed to clear the cart.
- Cart clearing remains tied to a confirmed paid Orduva order, not merely a paid Stripe intent.
- No Supabase SQL required.

## Ver-0.227 — Storefront product details popup polish

- Matched the desktop storefront product details popup width to the Tenant Admin edit product popup.
- Reduced the desktop product image size so the popup looks more professional and less cramped.
- Improved desktop spacing/layout inside the product details popup.
- No SQL required.

## Ver-0.227A — Product variant editor field labels and two-column layout

- Improved the Tenant Admin product variants editor so every variant input/control has a clear label.
- Changed variant option cards to a consistent two-fields-per-row layout on desktop/tablet where space allows.
- Removed the wasteful full-width variant description row.
- Kept product variant logic, stock logic, storefront logic and checkout logic unchanged.
- No Supabase SQL required.


## Ver-0.227B — Product editor save-state polish and second category

- Added unsaved-changes confirmation to the Tenant Admin product editor.
- Save button now changes to a light red tone when there are unsaved changes.
- Added premium product add/edit/delete toast notifications.
- Kept interactive Creating... / Saving... button states.
- Improved product and variant stock controls so stock tracking, stock quantity and low stock warning sit on the same line on desktop where space allows.
- Added optional second category support for products so a product can appear in two storefront sections.
- SQL required: add `products.secondary_category_id` and supporting index.


## Ver-0.227C — Variant popup stacking fix

- Raised the storefront variant chooser above other storefront popups so it opens in front of product details and search popups.
- Kept the existing variant popup layout, product details popup layout, cart logic, checkout logic and variant stock logic unchanged.
- No Supabase SQL required.

## Ver-0.228 — Owner Platform simplified client status overview

- Reworked the Owner Platform billing overview into a calmer client-status dashboard.
- Added three primary click-through cards: Paid clients, Free trial, and Trial expired.
- Replaced dense billing cards with a compact listing for the selected group.
- Kept refresh, search and export for the selected view.
- No database changes required.

## Ver-0.228A — Owner Platform row expansion and owner assist admin access

- Replaced the dense Owner Platform client list actions with compact row expansion.
- Removed the large Open store button from list rows.
- Expanded rows now show only owner-relevant account, billing and Stripe details.
- Kept client checklist progress out of the expanded billing view.
- Added owner-only support access for opening a tenant admin session from the Owner Platform.
- The owner access route uses the existing platform key / 2FA protection and does not expose tenant passwords.
- No Supabase SQL required.

## Ver-0.229 — Owner Platform Mega Menu and Dashboard Tidy
- Added a compact mega menu to the owner header.
- Removed duplicate page-level owner navigation links from the dashboard hero.
- Kept the dashboard focused on the client status grid/list.
- Removed the heavy checklist panel from the main dashboard view.
- No SQL required.


## Ver-0.229A — Owner Platform mega menu palette and hover polish

- Reworked the Owner Platform top navigation into three separate menu groups: Core platform, Money and growth, and Owner controls.
- Fixed the hover gap so dropdowns stay open while moving from the menu button into the dropdown.
- Removed the decorative up/down glyph styling from the menu and replaced the owner list row toggle with simple Details/Close text.
- Updated the Owner Platform palette away from orange-heavy styling toward black, blue #336699, and green highlights.
- Softened heavy title font weights across the owner dashboard area.
- No storefront, checkout, payment, product, or database logic changed.


## Ver-0.229B — Owner Platform menu close, favicon and PWA install

- Closed Owner Platform mega dropdowns immediately after selecting a menu item.
- Added a dedicated Owner Platform favicon and PWA icon with white background, Ord in blue #336699 and uva in black.
- Added an Owner Platform PWA manifest scoped to /platform for urgent owner access away from the office.
- Added a small Install app action in the Owner Platform header and registered the existing service worker from the owner area.
- No storefront, checkout, payment, product, tenant admin or database logic changed.


## Ver-0.229C — Owner Platform favicon shape correction

- Restored the Owner Platform favicon layout to the original stacked Orduva style, with Ord above Uva.
- Kept the requested colour update: Ord in blue #336699, Uva in black, on a white background.
- Removed the visible dark/black surround by filling the icon canvas edge to edge with white.
- Rebuilt the Owner Platform favicon and PWA icon sizes.
- No storefront, checkout, payment, tenant admin, product, variant or database logic changed.

## Ver-0.229D — Owner Platform approved favicon and PWA icon

- Replaced the Owner Platform browser favicon with the approved stacked Orduva icon.
- Rebuilt Owner Platform PWA icons using the same approved design.
- Kept the icon canvas white and square, with Ord in #336699 and Uva in black.
- No Supabase SQL required.


## Ver-0.229E — Owner Platform favicon routing and PWA install polish

- Replaced the Owner Platform browser favicon and PWA icons with the user-supplied approved artwork.
- Kept the artwork square with a full white canvas so browser/PWA masks do not add a black edge.
- Updated platform routing metadata so /platform uses the Owner Platform favicon and manifest instead of inheriting Tenant Admin metadata on admin.orduva.com.
- Updated the Owner Platform icon display areas to use a true circle crop.
- Improved the Owner Platform install button so it gives visible guidance if the browser cannot show the native install prompt.
- No storefront, checkout, payment, tenant admin, product, variant or database logic changed.
- No Supabase SQL required.


## Ver-0.229F — Owner Platform palette and expanded row spacing

- Applied the Owner Platform black, blue #336699, and green-highlight palette more consistently across platform pages and owner panels.
- Reduced old orange-heavy styling and softened overly heavy font weights in owner-only pages.
- Added visible spacing between expanded client rows and the next client row so the expanded view is easier to understand.
- Kept red styling for true warnings/errors only.
- No storefront, checkout, payment, tenant admin, product, variant or database logic changed.
- No Supabase SQL required.


## Ver-0.229G — Owner Platform PWA Identity Fix

- Forced the Owner Platform to use its own manifest and icon links on /platform.
- Added a dedicated Owner Platform service worker scoped to /platform.
- Added root manifest fallback logic so admin.orduva.com/platform does not inherit the Tenant Admin install identity.
- Updated install fallback wording for browsers that do not immediately show the native prompt.
- No SQL required.


## Ver-0.229J — Owner Platform blank-page stability rollback

- Paused Owner Platform PWA installation work while platform page stability is restored.
- Removed active Owner Platform service worker registration from the platform layout.
- Added a one-time browser cleanup for Owner Platform pages to unregister old service workers and clear Orduva caches.
- Forced Owner Platform pages to dynamic/no-store rendering to avoid stale skeleton/blank pages.
- Added no-store cache headers for `/platform` routes in middleware.
- No storefront, checkout, payment, Tenant Admin, product, or database changes.


## Ver-0.229K — Owner Platform palette and menu clarification

- Applied the blue Owner Platform header style consistently across platform pages.
- Removed duplicate page-header navigation buttons now that the mega menu handles navigation.
- Removed the ambiguous Store admin login item from the top mega menu. Owner-assisted tenant admin access now happens from an expanded client row, so Orduva knows exactly which tenant is being opened.
- Centred the mobile mega menu so it no longer runs off the page.
- Softened owner dashboard client cards toward the black / blue #336699 palette, keeping green for positive highlights and red only for genuine warnings.

## Ver-0.229L — Owner Platform header and menu correction
- Restored Owner Platform page headers to the previous white card style after the Ver-0.229K blue-gradient headers were too broad.
- Kept page-level duplicate navigation removed because the main mega menu now handles navigation.
- Added click-outside and Escape-key closing for the Owner Platform menu.
- Fixed the final desktop dropdown alignment so it does not open off-screen.
- No SQL required.

## Ver-0.230 — Password reset foundation

- Added Tenant/Admin forgot password and reset password pages.
- Added Storefront customer forgot password and reset password pages.
- Added shared password reset token API using Resend.
- Added secure one-use password reset tokens with 45 minute expiry.
- Uses existing Orduva email domain/configuration; no new Resend domain required.
- Added Supabase table `public.password_reset_tokens` with explicit `service_role` grant only.

## Ver-0.230A — Admin forgot password public route fix

- Fixed `/admin/forgot-password` redirecting back to `/admin/login`.
- Made `/admin/reset-password` public so email reset links can be opened without an admin session.
- No Supabase SQL required for this hotfix.

## Ver-0.231 — Customer-entered amount products

- Added customer-entered amount product type for invoice/deposit/balance payments.
- Added Tenant Admin product settings for amount label, reference label, min/max amount and reward/discount exclusions.
- Added storefront amount/reference popup using standard Orduva popup rules.
- Added checkout/order/payment support for customer-entered amount lines.
- Added SQL columns on products and order_items; no new public tables.



## Ver-0.231A — Customer-entered amount checkout build fix

- Fixed the local build error by adding customer-entered amount fields to the checkout cart item type.
- Preserved Ver-0.231 invoice/deposit/balance payment product behaviour.
- No Supabase SQL required.

## Ver-0.231B — Invoice payments settings and dedicated storefront cards

- Added Tenant Settings controls for enabling invoice payments.
- Added a dedicated first storefront section for customer-entered amount products.
- Invoice payment cards use a separate card layout without images, variants, favourites or normal product detail popups.
- Normal product category sections now exclude customer-entered amount products when they are shown through the invoice payments section.
- No payment provider setup changes and no new public table.


## Ver-0.231C — Invoice payment cards storefront visibility fix

- Fixed storefront payload so Invoice payments settings are actually returned to the storefront.
- Bumped storefront cache key to avoid old cached storefront data hiding newly enabled invoice cards.
- Changed storefront products endpoint/client fetch to no-store so tenant setting changes appear immediately after saving.
- No database changes.

## Ver-0.231D — Standalone invoice payment flow

- Separated invoice/deposit/statement payments from the normal storefront cart.
- Tenant Settings now manages the three dedicated payment cards directly.
- Storefront payment cards now open a dedicated payment popup and send customers straight to the configured online payment provider.
- Normal product cards, variants, stock, rewards, discounts and cart checkout are not used for these payment cards.
- Added SQL to allow invoice-payment order items to have no product_id because they are not stock products.
- No payment provider setup was changed.

## Ver-0.231E — Checkout back to storefront icon

- Added a compact Back to storefront button at the top of checkout.
- Uses the tenant checkout palette and preserves the cart when returning to the storefront.
- No checkout/payment/provider/cart logic changed.


## Ver-0.231F — Restore normal checkout product pricing

- Fixed normal product checkout pricing after the standalone invoice payment work.
- Cart lines now store a safe unit-price snapshot when ordinary products are added.
- Checkout falls back to the cart price snapshot if a product payload is stale or temporarily reports zero.
- Checkout now removes stale customer-entered amount payment rows from the cart because invoice/deposit/balance payments are no longer cart items.
- No database changes.


## Ver-0.231G — Normal checkout base price zero fix

- Fixed ordinary product checkout rows showing 0.00 after the invoice-payment work.
- Root cause: base-product cart lines without a variant stored `variantPrice: null`, and the checkout variant price helper treated `null` as a real numeric zero.
- Updated variant price helpers so null/empty fallback values do not override the real base product price.
- Preserved standalone invoice payments and did not change payment provider configuration.

## Ver-0.232 — Discount and rewards popup colour controls

- Added tenant-configurable colour groups for Rewards popup and Discount popup.
- Added header blend colour controls for both popup headers.
- Applied tenant-selected colours to visible popup surfaces on storefront.
- Preserved standard Orduva popup spacing and shell behaviour.
- No Supabase SQL required.


## Ver-0.232A — Theme editor preview and popup polish

- Restored the desktop per-item storefront colour preview as a sticky right-hand panel while editing colours.
- Added dedicated Rewards popup and Discount popup previews to the theme editor preview selector.
- Suggested colours are now hidden by default on desktop and can be opened from a button under the preview.
- Applied the standard Orduva popup spacing pattern to Tenant Admin settings popups and the main product manager popups.
- No Supabase SQL required.


## Ver-0.232B — Floating desktop theme preview

- Changed the desktop per-item storefront colour preview from an in-section sticky panel to a fixed floating preview panel.
- The preview now stays visible while editing any theme colour group on desktop.
- Added a compact collapse/expand control to keep the editor usable on shorter screens.
- Suggested colours remain hidden by default and accessible under the floating preview.
- No Supabase SQL required.

## Ver-0.232E — Theme preview and suggested colours polish

- Removed the preview target/search pills from the desktop Theme Preview Window.
- Constrained the desktop Preview and Suggested Colours windows to the Per-item storefront colours workspace.
- Kept colour editing controls on the left side of the desktop workspace and left the right side clear for floating windows.
- Reworked Suggested Colours so each colour has a softer copy icon inside the colour pill instead of a harsh Copy button.
- No Supabase SQL required.

## Ver-0.232F — Tenant Settings UX Polish
- Polished Tenant Admin Settings into a calmer, more professional layout.
- Added desktop two-column panel organisation.
- Made open panels clearly visible with a 2px black border.
- Reduced heavy title weights and toned down mixed structural colours.
- Preserved the per-item colour editor workspace behaviour.
- No SQL required.

## Ver-0.232G — Theme preview placement correction

- Removed the right-side “Clear preview area” instruction card and left the right half as plain white space.
- Preview and Suggested Colours windows now open beside the currently expanded colour group rather than always opening near the first panel.
- Floating preview/suggested windows remain constrained inside the Per-item storefront colours workspace.
- No SQL required.

## Ver-0.232H — Global Tenant Admin UX polish

- Applied the calmer Tenant Admin Settings visual rules more broadly across Tenant Admin pages.
- Added a global admin content wrapper so desktop admin panel grids can settle into a cleaner two-panel rhythm.
- Standardised panel borders toward clear neutral lines and reduced mixed structural colour noise.
- Reduced heavy heading/title weights across Tenant Admin surfaces.
- Added global support for clear black outlines on open/active panels.
- Preserved the Per-item storefront colours workspace and preview/suggested colour behaviour from Ver-0.232G.
- No SQL required.


## Ver-0.232I — Tenant Settings panel cleanup

- Removed harsh black separator/outline behaviour from open settings panels.
- Removed saved logo/favicon URL display blocks.
- Fixed logo/favicon upload button text contrast.
- No SQL required.

## Ver-0.238N — Admin toast contrast and store-owner wording

- Updated admin toast notifications to a higher-contrast Orduva admin scheme: deep green background, orange border/accent, and white text/icons.
- Replaced store-owner-facing “Tenant” wording with clearer “Store”, “Store Admin” or “My Account” wording where relevant.
- Kept developer/internal tenant naming in code identifiers and database fields unchanged.
- No SQL required.

## Ver-0.240 — Logo palette lockdown and suggested colours picker

- Reworked the logo palette preset so one loud colour from the logo does not flood the whole storefront.
- Logo-generated themes now keep structural areas white/neutral and distribute logo colours across primary, accent, secondary and strong-accent uses.
- Added stored uploaded-logo colours to the Suggested Colours panel, shown first so store owners can copy/pick from the real logo palette while editing.
- Updated logo palette wording to explain that Suggested Colours is where each extracted logo colour can be used deliberately.
- No SQL required.

## Ver-0.241 — Storefront desktop popup sizing correction

- Moved the desktop product details popup up by 10px so it sits closer to visual centre.
- Matched desktop Rewards, Offers, Favourites and Buy Again popup sizing to the product details popup standard.
- Kept Favourites and Buy Again internal layouts unchanged, including the swipe/strip behaviour, while fixing the popup wrapper so the page scrollbar no longer appears outside the panel.
- Preserved internal scroll behaviour inside popup bodies where applicable.
- No SQL required.

## Ver-0.241A — Storefront popup cart controls and content cleanup

- Added cart buttons to the Favourites and Buy Again popup headers on desktop and mobile.
- Add-to-cart animations from Favourites and Buy Again now target the popup cart button while the popup is open, not the storefront header cart.
- Moved Offers & discount codes and Rewards Club popups up by a further 7px on desktop only.
- Removed the Order note panel and helper text from the product details popup on desktop and mobile.
- No SQL required.

## Ver-0.242 — Owner platform trial and billing controls

- Added visible trial extension tools to the Owner Platform Selected list when viewing Trial expired stores.
- Moved the active billing popup control out of the Configure menu and into the Account menu, while leaving checklist controls in Configure.
- Added a bottom Close button to the active billing popup using the existing popup pattern.
- Updated the active billing countdown to refresh while the popup is open.
- Removed the duplicate Open storefront control from the Account mobile menu footer; the Account menu item remains available once.
- No SQL required.


## Ver-0.242A — Active billing popup countdown and sizing fixes

- Reduced the desktop-only Active Billing popup outer spacing to give the modal more useful room.
- Changed the bottom Close button on the Active Billing popup from full-width to a 180px desktop button while preserving mobile usability.
- Reworked the Active Billing countdown so it uses the linked Stripe subscription current period end instead of the old trial end date.
- Added live billing-status refresh while the Active Billing popup is open so the next payment information can populate and update.
- Kept the change scoped to the Active Billing popup and version references only.
- No SQL required.


## Ver-0.243 — Tenant Admin popup sizing, placement, button and close icon

- Applied the approved Active Billing desktop popup size/placement as the Tenant Admin popup standard.
- Added reusable Tenant Admin popup CSS classes in `app/globals.css`.
- Updated existing Tenant Admin popups to use the shared overlay, shell, header, body and footer treatment.
- Changed top-right popup close icons to a grey-on-white control instead of a black control.
- Moved sticky-footer close/action controls to the right on desktop.
- Documented the exact popup rules for future builds.
- No Supabase SQL required.

## Ver-0.242B — Active Billing popup actual desktop size fix

- Increased the desktop Active Billing popup panel cap so it actually uses the extra room created by the reduced overlay padding.
- Kept mobile popup sizing unchanged.
- Kept the 180px desktop Close button from Ver-0.242A.
- Scoped the change to the Active Billing popup sizing and version references only.
- No SQL required.



## Ver-0.246C - Storefront hydration preparing shell fix

- Patch type: touched-files-only ZIP.
- Fixed the remaining storefront hydration mismatch by making the React preparing shell fully static on the first server/client render.
- Removed logo-colour and cached-payload styling from the first-render loading shell.
- Store-specific theme colours are applied only after the storefront payload is loaded and the live storefront renders.
- No Supabase SQL required.

## Ver-0.247 - Storefront welcome banner and About us additions

- Patch type: touched-files-only ZIP.
- Added Theme settings controls for a storefront welcome background banner image.
- Added overlay colour, overlay strength, image fit and welcome text alignment controls so text stays readable over the image.
- Added an About us storefront section with image upload, title, paragraph text, alignment, panel background and text colour controls.
- About us renders before the store product category sections when enabled.
- Extended tenant asset uploads to support welcome banner and About us images without requiring new database columns.
- Stored the new settings inside the existing storefront theme JSON, so no Supabase SQL is required.


## Ver-0.247A - Storefront welcome/About mobile controls and panel sizing

- Patch type: touched-files-only ZIP.
- Duplicated welcome background controls for mobile while keeping the desktop controls as the desktop source.
- Duplicated About us controls for mobile while keeping the desktop controls as the desktop source.
- Added Use same controls so mobile can reuse desktop welcome/About data without re-entering it.
- Added welcome text panel colour transparency control.
- Enlarged the desktop welcome text panel by about 35% when a welcome background image is active.
- No Supabase SQL required.

## Ver-0.247B - Storefront welcome banner and About us spacing polish

- Patch type: touched-files-only ZIP.
- Enlarged the desktop welcome banner panel by increasing its desktop-only height and padding when a welcome background image is active.
- Added extra top spacing above the About us panel so it does not sit too close to the welcome panel.
- Reduced the About us title weight to match the calmer storefront title style.
- No Supabase SQL required.


## Ver-0.247C - Storefront welcome/about sizing and padding controls

- Patch type: touched-files-only ZIP.
- Centred the welcome text panel inside the welcome banner panel.
- Added desktop and mobile welcome banner height controls in pixels.
- Added desktop/mobile outer padding controls for welcome panels with current/default values shown for reference.
- Added desktop/mobile outer padding controls for About us panels with current/default values shown for reference.
- No Supabase SQL required.

## Ver-0.247D - Storefront welcome/about padding control layout polish

- Patch type: touched-files-only ZIP.
- Changed Welcome and About us padding controls to sit around a mock panel: top above, left on the left, right on the right, and bottom below.
- Removed repeated Current/default reference helper text from individual px input fields.
- Corrected About us padding description wording from outer spacing inside the panel to outer spacing of the panel.
- No Supabase SQL required.
## Ver-0.248 - Store Admin sales overview

- Patch type: touched-files-only ZIP.
- Added Daily, Weekly and Monthly sales overview cards to the Store Admin home page before the main panels.
- Added browser-saved default display selection controls for the sales cards.
- No Supabase SQL required.
## Ver-0.248a - Store Admin sales overview display polish

- Patch type: touched-files-only ZIP.
- Removed the sales overview Show by default selector from the Store Admin home page.
- Kept all three sales cards visible by default.
- Locked the card order to Daily, Weekly, Monthly.
- No Supabase SQL required.

## Ver-0.251 - Orders refresh control update

- Patch type: touched-files-only ZIP.
- Removed the 20-second Orders page auto-refresh timer.
- Kept a manual Refresh now button for Store Admin orders.
- Added a one-time refresh when the Orders page becomes visible/focused again.
- Added helper text: "New order alerts are sent by notification. Use Refresh now if needed."
- No Supabase SQL required.

## Ver-0.252 - Checkout loading and panel order polish

- Patch type: touched-files-only ZIP.
- Added delayed checkout loading feedback when the storefront cart button opens checkout, so fast loads do not show a popup but slow loads show a clear "Opening checkout…" animation after 1 second.
- Added delayed checkout submit loading feedback while an order is being saved or an online payment handoff is being prepared.
- Reduced checkout navigation delay risk by timing out the notification pre-check and continuing to checkout instead of leaving the customer waiting.
- Reordered the checkout layout so the Order summary appears first, followed by signed-in/guest status, then payment method selection.
- Updated customer-facing wording around checkout steps and store-owned online payment providers.
- No Supabase SQL required.

## Ver-0.252a - Checkout loading UX and back navigation polish

- Patch type: touched-files-only ZIP.
- Changed the storefront checkout-opening loader to use the same warm Orduva graphic and orange loading style as the startup "We're getting things ready" screen.
- Removed the 1-second delay before the checkout-opening loader. It now appears immediately before notification checks run.
- Kept the checkout-opening loader visible for a minimum of 2 seconds by handing the timing from the cart button to the checkout page, preventing fast-load flashing.
- Updated checkout submit loading to use the same Orduva loading graphic/colours for visual consistency.
- Changed checkout Back to storefront / Back to menu actions from `window.location.href = "/"` full reloads to client-side navigation/back behaviour, so returning to the menu avoids a forced hard page reload where possible.
- No Supabase SQL required.

## Ver-0.253 - Push notification settings and admin test controls

- Patch type: touched-files-only ZIP.
- Added a Push notifications section to Store Admin Settings.
- Added editable title/message text for Store Admin new-order/test pushes and customer order-flow pushes.
- Added Send push checkboxes so customer order statuses can still be updated without sending a push for that status.
- Added Store settings admin test push button.
- Updated push sending to respect the saved notification templates and enabled/disabled flags.
- Customer pushes now default to the store favicon icon only.
- Store Admin pushes now default to the Orduva favicon icon only.
- Updated service workers so notification badge graphics are only included when explicitly supplied, reducing unwanted extra graphics on mobile notifications.
- Supabase SQL required: SUPABASE_VER_0_253_PUSH_NOTIFICATION_SETTINGS.sql.

## Ver-0.253b - Push notification device controls and icon cleanup

- Patch type: touched-files-only ZIP.
- Hid the Enable admin push on this device button on desktop/laptop browsers. It now only appears on mobile/tablet-style devices that can receive the Store Admin push subscription.
- Removed the Send local phone test button from the Push notifications settings section.
- Removed the Refresh device status button; device status is now checked automatically when the section opens, after enabling a phone/tablet, and after sending a real push test.
- Added clearer device status text so desktop can still send the real push test to saved phones without pretending it is a receiving device.
- Removed notification icon/badge payloads from admin and customer service-worker notifications so Android/Chrome does not show the extra right-hand graphic. The notification should rely on the installed site/app favicon on the left only.
- No Supabase SQL required.

## Ver-0.254a - Product details popup mobile title and price row polish

- Patch type: touched-files-only ZIP.
- Mobile-only change: forced the Product Details popup price pill and stock/pre-order ribbon to share one row where space allows.
- Mobile-only change: moved the product title down another 15px so the title can use the full popup width below the cart/close controls.
- Mobile-only change: kept the product title on one line with safe overflow handling to preserve more vertical room for the description area.
- No Supabase SQL required.


## Ver-0.254b - Product details popup mobile title and home ribbon lock

- Patch type: touched-files-only ZIP.
- Mobile-only Product Details popup change: reduced the title size by around 20% and kept it semi-bold.
- Mobile-only Product Details popup change: removed the single-line truncation so the full product title can display while still using more of the available line width below the cart/close buttons.
- Product home panels change for mobile and desktop: moved only the stock/pre-order ribbon 10px left and 3px up without changing any other product-card element positions.
- Locked the product home-panel ribbon position for no further editing unless specifically requested.
- No Supabase SQL required.

## Ver-0.254c - Product ribbon, share link and offers popup polish

- Patch type: touched-files-only ZIP.
- Product home panels: moved only the stock/pre-order ribbon a further 5px left and 3px up without changing any other product-card element.
- Product Details popup share: removed the product description from the shared/copied link text so the description does not appear twice.
- Added a shorter `/p/[productId]` product share route that redirects to the existing shared product page.
- Restyled the Offers/Discounts popup to follow the Product Details popup standard: softer white panel, light header, top-edge accent, rounded inner cards and dark Close button.
- No Supabase SQL required.


## Ver-0.255 - Product ribbon, startup loader and variant-required products

- Patch type: touched-files-only ZIP.
- Product home panels: moved only the stock/pre-order ribbon a further 3px left and 3px up without changing any other product-card element.
- Desktop startup loader: widened the Orduva preloader card and kept “We’re getting things ready.” on one line on desktop while preserving the mobile layout.
- Tenant Admin products: added a Product variants option so store owners can mark the base product as display-only and require customers to choose a variant before adding to basket.
- Storefront variant picker: hides the Standard product option when the product requires a variant.
- Order API validation now rejects base-product cart lines for products marked as requiring a variant.
- Supabase SQL required: SUPABASE_VER_0_255_PRODUCT_REQUIRES_VARIANT.sql.

## Ver-0.255A - Product required variant build fix

- Patch type: touched-files-only ZIP.
- Fixed TypeScript build error in Tenant Admin ProductManager after Ver-0.255.
- Added the missing `productRequiresVariant` value to the draft created after adding a new product, so the shared DraftState type is complete.
- No Supabase SQL required for this fix. The Ver-0.255 product_requires_variant SQL is still required if it has not already been run.

