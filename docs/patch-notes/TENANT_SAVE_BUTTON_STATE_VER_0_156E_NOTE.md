# Orduva Ver-0.156E — settings save button state and logo autosave clarity

This same-thread settings UX fix improves the tenant settings page after the Supabase Storage logo/favicon upload work.

## Changes

- Removes the remaining Save section button from the Branding and wording / logo area to avoid confusion with autosaved logo and favicon uploads.
- Keeps logo/favicon uploads as immediate autosave actions.
- Keeps the normal bottom Save settings button for manual text, URL, colour, contact and currency edits.
- Makes section save buttons disabled/greyed out until there is an actual unsaved change in that section.
- Makes per-theme-group save buttons disabled/greyed out until that specific colour group has changed.
- Makes the main Save settings button disabled/greyed out until there is something to save.
- After a successful manual save, the form records the new saved state so the buttons return to Nothing to save.
- After logo/favicon upload, the saved state is updated immediately because those uploads already save automatically.

## No SQL required

No Supabase SQL changes are required for this patch. Continue using the Ver-0.156A tenant-assets Supabase Storage setup.
