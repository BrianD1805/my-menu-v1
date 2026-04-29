# Orduva Ver-0.137E — Desktop Theme Preview Sticky Fix

This patch fixes the advanced theme editor desktop preview behaviour.

Changes:
- Removes the internal max-height/overflow-y scroll behaviour from the right preview column.
- Applies sticky positioning to the outer right-hand preview wrapper in the main page flow.
- Changes the admin shell main wrapper from overflow-hidden to overflow-x-clip so CSS sticky is not blocked by an overflow ancestor.
- Leaves mobile behaviour unchanged.

No logic changes were made to saving, storefront themes, orders, customer accounts, push, onboarding, or domain routing.
