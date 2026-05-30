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

