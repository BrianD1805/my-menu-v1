# Orduva Patch Ver-0.221 — Settings Page Desktop UX Redesign

## Purpose
This patch starts the desktop settings redesign so the page no longer forces every operational setting into a narrow left column beside a sticky live preview.

## Changes
- Removed the page-wide split layout from Tenant Settings on desktop.
- Settings now use a wider full-page working area by default.
- The Live Section Preview no longer sits as a permanent right-hand sticky panel for every settings section.
- Theme preview is now contained inside the Per-item Storefront Colours/theme editor section only.
- Operational areas such as payments, rewards, discounts, contact details and advanced currency display now use the full desktop width.
- Added a short workspace explanation at the top of the settings page to separate:
  - Theme editor with preview
  - Operational settings full width
- Updated the bottom helper text to match the new layout.

## Safety
- No payment logic changed.
- No Direct M-Pesa/Daraja logic changed.
- No Stripe/Yoco/Pesapal logic changed.
- No rewards or discount calculation changed.
- No product card UI changed.
- No Supabase SQL required.

## Version
Ver: 0.221
