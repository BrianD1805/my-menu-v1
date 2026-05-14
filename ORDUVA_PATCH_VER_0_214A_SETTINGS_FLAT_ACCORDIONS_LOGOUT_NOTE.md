# Orduva Patch Ver-0.214A — Settings flat accordions and signed-in logout placement

## Summary
UX-only follow-up to Ver-0.214.

## Changes
- Flattened Tenant Settings accordion content so expanded settings open on the same white card surface as the parent section.
- Removed the extra inner accordion body border and grey sub-container treatment.
- Kept the section save button inside the same visual card without adding another framed area.
- Moved the Tenant Admin logout button into the same panel as the "Signed in as" label.
- Removed the repeated bottom logout area from the admin shell so it no longer appears below every admin page/section.
- Bumped live version to Ver: 0.214A.
- Bumped service worker cache keys to Ver-0.214A.

## Behaviour preserved
- No Stripe logic changed.
- No Yoco logic changed.
- No payment provider settings logic changed.
- No Supabase SQL required.
