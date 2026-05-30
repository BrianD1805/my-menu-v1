# ORDUVA PATCH VER-0.227C — VARIANT POPUP STACKING FIX

## Purpose
Fix the storefront variant chooser opening behind existing storefront popups such as Product Details and Search.

## Changes
- Raised the variant chooser overlay z-index so it appears in front of Product Details and Search popups.
- Applied the fix to both product card and menu browser variant picker paths.

## Not changed
- No checkout logic changed.
- No payment provider logic changed.
- No product card UI changed.
- No variant stock logic changed.
- No database/schema changes.

## SQL
No Supabase SQL required.
