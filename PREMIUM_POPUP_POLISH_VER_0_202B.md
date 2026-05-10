# Orduva Ver-0.202B — Premium popup polish

## Purpose
Polish the Tenant Admin Stripe setup guide popup so it feels more premium on desktop and mobile.

## Changes
- Bumped visible version to Ver: 0.202B.
- Made the Stripe setup guide popup use a fixed-height premium modal shell.
- Made the popup title/header sticky and always visible.
- Kept the close button visible while the content scrolls.
- Moved scrolling into the popup body so the scrollbar stays neatly inside the modal.
- Added comfortable bleed space under the sticky header.
- Added bottom bleed space after the footer button so the popup does not feel cramped.
- Preserved the existing Stripe setup guide wording and tenant-owned Stripe warning.

## Testing
1. Open Tenant Admin.
2. Go to Store settings.
3. Open Storefront payment options.
4. Click Help me find these keys.
5. Confirm the title/header and close button remain visible while scrolling.
6. Confirm the scrollbar stays inside the popup body.
7. Confirm there is comfortable spacing under the header and at the bottom on desktop and mobile.

## Supabase SQL
No Supabase SQL required.
