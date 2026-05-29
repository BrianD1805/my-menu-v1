# Orduva Ver-0.156F — Logo palette generator

This patch adds a tenant settings polish pass for generating a colour palette from the uploaded store logo.

## What changed

- Bumped the app version to Ver: 0.156F.
- Added a Generate from logo button inside the Suggested colours panel.
- The generator reads the current uploaded logo URL, extracts a small set of usable colours, and creates a selectable Logo palette.
- The generated colours are added to Suggested colours so users can copy them into individual colour fields if they want to fine-tune manually.
- The generated Logo palette is also added to the Theme presets area as a selectable palette option.
- Generating the palette applies it as a draft theme only. The user must still save the Theme presets/settings section to make it live.
- Saved logo palette colours are stored in storefront_theme_json.logoPaletteColours so they remain available after refresh.

## No Supabase SQL required

This patch reuses the existing tenant_settings.storefront_theme_json column.

## Safety

This patch does not change Supabase Storage upload behaviour, public onboarding, storefront product card layout, wildcard routing, push notifications, or payment logic.
