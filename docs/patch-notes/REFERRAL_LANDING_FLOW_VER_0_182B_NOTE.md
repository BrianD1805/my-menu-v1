# Orduva Ver-0.182B — Referral landing flow

## Summary

This patch changes the tenant referral advert flow so a storefront advert sends prospects to the public Orduva landing page first, while preserving referral tracking all the way through to the Create your own store page.

## Behaviour

- Storefront advert now links to `https://www.orduva.com/?ref_tenant=<tenant-slug>&ref=tenant_<tenant-slug>&ref_source=storefront_footer`.
- The public landing page stores referral details in session storage.
- The main landing page Create your own store CTA carries the same referral parameters through to `/start-your-store`.
- The onboarding form preserves the original landing page referral URL instead of overwriting it with the `/start-your-store` URL.
- Referral capture still records against the new tenant when the store is created.

## Supabase

No Supabase SQL required. Uses the referral tables added in Ver-0.182.
