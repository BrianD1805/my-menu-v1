# Orduva Ver-0.209 — Orduva Analytics Foundation

## Purpose
Adds a careful, lightweight analytics foundation across Orduva without noisy tracking.

## Scope
Tracks useful business events across:
- Public landing pages
- Tenant storefront subdomains
- Tenant admin pages
- Owner platform pages
- Affiliate pages
- Checkout flow

## Events recorded
- page_view
- storefront_visit
- product_view
- product_share
- add_to_cart
- checkout_started
- order_created
- referral_link_click
- affiliate_apply_click

## Not recorded
- Mouse movement
- Scroll depth
- Keystrokes
- Private form contents
- Session recordings

## New pages
- Tenant Admin: /admin/analytics
- Owner Platform: /platform/analytics

## Supabase
Run before deployment:
SUPABASE_VER_0_209_ORDUVA_ANALYTICS_FOUNDATION.sql

## Notes
The raw events table is intended for near-term dashboard use. A daily summary table is included for future rollups and cleanup so Orduva does not have to keep every raw event forever.
