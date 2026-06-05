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

# Orduva Patch Log

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
