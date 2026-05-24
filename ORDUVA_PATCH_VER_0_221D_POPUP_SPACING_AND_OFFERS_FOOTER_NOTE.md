# Orduva Patch Ver-0.221D — Popup spacing and Offers footer polish

## Purpose

Follow-up to Ver-0.221C storefront popup premium polish.

## Changes

- Keeps the existing premium storefront popup standard.
- Changes popup outer spacing to 35px left/right and 75px top/bottom.
- Updates popup max-height to account for the 75px top and bottom breathing space.
- Removes the Go to checkout button from the Offers & discount codes popup.
- Changes the Offers popup Back to menu button to use the same green styling previously used by Go to checkout.
- Bumps visible version and service worker caches to Ver: 0.221D.

## Popup standard to reuse in future

Use this standard for new storefront popups:

1. Overlay: fixed inset-0, centred with flex, bg-slate-950/60, backdrop blur.
2. Outer spacing: 35px left/right and 75px top/bottom.
3. Modal max height: calc(100dvh - 150px).
4. Modal shell: flex column, overflow hidden, rounded 24/28px, white background, soft shadow, subtle border.
5. Green top edge: absolute top bar inside the sticky header using a thin 1px/4px emerald-to-slate-to-emerald gradient.
6. Header: sticky top-0, z-10, non-scrolling, with title and close button.
7. Body: min-h-0 flex-1 overflow-y-auto overscroll-contain, with top bleed below the header and bottom bleed before the footer.
8. Footer: sticky bottom-0, z-10, non-scrolling, with the primary action/back buttons always visible.
9. Scrolling: only the popup body scrolls; the page behind must remain locked.
10. Buttons: primary popup actions use the soft emerald button treatment unless the store-specific palette intentionally overrides it.

## SQL

No Supabase SQL required.
