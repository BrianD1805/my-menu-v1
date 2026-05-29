# Orduva Ver-0.156G — settings UX tidy for branding, saves and logo palette

## Summary

This patch tidies the tenant settings page after the logo palette generator work.

## Changes

- Split Logo and favicon into its own autosave-only section.
- Branding and wording now has its own Save section button.
- Logo and favicon URLs are shown as read-only saved URLs rather than editable branding fields.
- Logo/favicon uploads remain autosave-only and do not show a save button.
- Removed the always-active outer Save section button from Per-item storefront colours.
- Per-item colour groups now rely on their own group save buttons, which grey out when there is nothing to save.
- Generated logo palette remains available as a Theme preset.
- Removed the duplicated generated logo palette block from Suggested colours.
- Logo palette colours are no longer copied into the Suggested colours swatch list; the palette is selected from Theme presets instead.

## Supabase

No SQL required.
