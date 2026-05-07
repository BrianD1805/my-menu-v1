# Orduva Ver-0.181A — PWA splash navigation fix

This is a same-thread fix after Ver-0.181.

## Problem

Browser loads were working, but installed PWA launches could remain stuck on the native splash screen. The storefront service worker was using a network-first navigation strategy without a short fallback, so Android could keep showing the native splash while the first page request waited on Netlify/Next.

## Fix

- Changed service worker navigation handling to prefer a cached page shell immediately when available.
- Normalised cached navigation keys so `/?source=pwa&app=storefront` can reuse the cached `/` shell.
- Added a 3.5 second first-load navigation timeout with a small Orduva retry screen instead of allowing the PWA splash to appear stuck forever.
- Kept `/api/products` stale-while-revalidate caching.
- Bumped storefront local payload cache version.

## Supabase

No Supabase SQL required.
