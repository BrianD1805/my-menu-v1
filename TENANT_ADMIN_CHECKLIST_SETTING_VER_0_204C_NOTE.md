# Orduva Ver-0.204C — Tenant admin checklist visibility setting

## Purpose
Adds a tenant admin setting to switch the new client setup / launch checklist on or off without changing the owner platform sign-in flow, storefront payment flow, Stripe settings, or product card UI.

## Changed files
- `app/admin/settings/page.tsx`
- `components/admin/TenantSettingsForm.tsx`
- `components/admin/AdminHeaderTools.tsx`
- `lib/version.ts`

## Behaviour
- Store Settings now includes an **Admin workspace** section.
- The new **Show new client setup checklist** toggle controls whether the checklist button appears in the tenant admin header.
- Switching it off uses the existing `tenant_launch_checklists` `__dismissed` state.
- Switching it back on clears that dismissed state.

## Supabase
No new Supabase SQL is required. This patch reuses the existing `tenant_launch_checklists` table and `__dismissed` checklist key.
