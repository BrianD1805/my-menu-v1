# Orduva Ver-0.202D — Settings menu and back-to-top polish

## Changes
- Bumped visible version to Ver: 0.202D.
- Bumped service worker/cache strings to ver-0-202d.
- Moved the Settings menu action into a Store workspace shortcuts panel near the top of Store settings, directly under the admin workspace header area.
- Removed the Settings menu button from the branding editor title row.
- Reworked the Back to top control as a smaller premium icon button instead of a chunky text button.
- Lifted the Back to top icon higher on mobile so it clears the bottom admin navigation.
- Lifted the Back to top icon on desktop so it does not sit too low against the screen edge.

## Testing
1. Open Tenant Admin > Store settings.
2. Confirm Settings menu appears in the Store workspace shortcuts area near the top.
3. Confirm the branding editor heading no longer carries the Settings menu button.
4. Open Settings menu and confirm the polished popup still works.
5. Scroll down on desktop and mobile and confirm the Back to top icon is visible, premium, and not too low.
6. Tap/click the Back to top icon and confirm it returns to the top of settings.

No Supabase SQL required.
