# Orduva Patch Ver-0.225D — Documentation tidy and rolling patch log

## Purpose

This patch tidies the project documentation structure by moving historical root-level Markdown notes into `docs/patch-notes/` and starting a single rolling patch log at `docs/ORDUVA_PATCH_LOG.md`.

## What changed

- Created `docs/patch-notes/`.
- Moved historical root-level `.md` patch notes into `docs/patch-notes/`.
- Kept `README.md` and `HANDOVER.md` in the project root.
- Created `docs/ORDUVA_PATCH_LOG.md` for new rolling patch entries.
- Bumped visible version to `Ver: 0.225D`.

## What did not change

- No storefront logic changed.
- No Tenant Admin logic changed.
- No checkout logic changed.
- No payment provider logic changed.
- No product card UI changed.
- No product variant logic changed.
- No Supabase schema changed.

## Going forward

Use `docs/ORDUVA_PATCH_LOG.md` for normal patch notes.

Only create a separate Markdown note when a patch needs a detailed handover, SQL reference, operational checklist, or important warning. If a separate note is needed, place it in `docs/patch-notes/`, not in the project root.
