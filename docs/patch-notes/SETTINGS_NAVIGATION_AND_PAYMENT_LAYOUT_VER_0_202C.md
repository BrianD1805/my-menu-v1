# Orduva Ver-0.202C — Settings navigation and payment layout polish

This patch polishes Tenant Admin > Store settings after the Stripe setup guide popup work.

## Changes

- Bumped visible version to Ver: 0.202C.
- Bumped service worker/cache strings to ver-0-202c.
- Removed the extra enclosing container around Online payment providers so it uses the same full-width hierarchy as Storefront payment options.
- Added a premium Settings menu button at the top of the settings form.
- Added a sticky-header settings menu popup with anchors to each major settings section.
- Added section anchors for Logo and favicon, Branding and wording, Theme presets, Per-item storefront colours, Business contact details, Storefront payment options, and Advanced currency display.
- Added a premium Back to top button to reduce long mobile scrolling.
- Kept the Stripe setup guide popup styling from Ver-0.202B intact.

## Testing

1. Open Tenant Admin > Store settings.
2. Confirm the online payment provider area is no longer squeezed inside an extra grey container.
3. Click Settings menu.
4. Confirm the popup opens with the same premium sticky-header style.
5. Click each menu item and confirm it scrolls to the correct section.
6. On mobile, confirm the menu saves scrolling time.
7. Confirm the Back to top button scrolls back to the top of settings.
8. Confirm the Stripe Help me find these keys popup still works.

No Supabase SQL required.
