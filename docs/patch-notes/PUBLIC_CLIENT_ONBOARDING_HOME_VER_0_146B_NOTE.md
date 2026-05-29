# Orduva Ver-0.146B — public CTA home-anchor fix

## Purpose

This is a same-thread fix after Ver-0.146A. The public landing page client CTAs must never send potential clients to `/platform/onboarding`; that route is for the Orduva owner/platform area only.

## Changes

- Bumped version to `Ver: 0.146B`.
- Changed public landing page client onboarding CTAs from local hash links to explicit home-page anchor links: `/#client-onboarding`.
- Increased the client onboarding section scroll offset so the anchored section lands more neatly below the top of the viewport.
- Left the owner-only `/platform/onboarding` route intact for Orduva owner use.

## Safety

No database, routing, storefront, push notification, product card, customer account, or theme editor logic was changed.
