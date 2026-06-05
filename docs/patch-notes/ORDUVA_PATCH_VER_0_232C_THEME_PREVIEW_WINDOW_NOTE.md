# Orduva Patch Ver-0.232C — Theme Preview Window Correction

## Purpose
Fix the Ver-0.232B floating preview behaviour. The preview must not remain visible across the whole Tenant Admin settings page.

## Changes
- Removed the always-visible fixed preview panel behaviour.
- Added a desktop-only draggable preview window launched from the Per-item storefront colours editor.
- Preview window can be moved around the screen and stays above Tenant Admin content while open.
- Preview window has close and collapse controls.
- Preview remains tied to the colour editor and does not appear automatically on unrelated Tenant Settings sections.
- Mobile behaviour remains unchanged and continues to use the existing popup preview.

## SQL
No Supabase SQL required.
