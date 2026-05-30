# Orduva Patch Ver-0.227 — Storefront Product Details Popup Polish

## Summary
Polished the storefront product details popup on desktop after the Tenant Admin product editor popup width changes affected the storefront detail modal feel.

## Changes
- Desktop storefront product details popup now uses the same approximate desktop width as the Tenant Admin edit product popup: `max-w-[885px]`.
- Desktop overlay spacing now follows the Tenant Admin popup spacing pattern.
- Product image height has been reduced on desktop so it no longer dominates the modal.
- Product details content now uses a tighter, more professional two-column layout on desktop.
- Header and footer desktop spacing has been compacted to avoid wasting vertical space.

## Guardrails
- Desktop-only layout polish for the storefront details popup.
- No checkout logic changed.
- No payment provider logic changed.
- No cart logic changed.
- No product card UI changed.
- No variant stock logic changed.
- No database/schema changes.
