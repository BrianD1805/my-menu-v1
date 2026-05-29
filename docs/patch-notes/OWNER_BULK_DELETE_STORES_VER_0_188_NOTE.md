# Orduva Ver-0.188 — Owner bulk delete stores

Adds an owner-only cleanup tool to the main platform dashboard.

## What changed

- Added checkbox selection on store cards in `/platform`.
- Added a single bulk delete action instead of a delete button on each tenant panel.
- Added a danger-zone confirmation popup listing all selected stores.
- Owner must type `DELETE ALL` in capitals before deletion can run.
- Added `/api/platform/stores/delete`, protected by the same owner platform key and 2FA session.

## Data deleted

For selected tenants, the API removes related records from:

- orders and order_items
- products and categories
- tenant_settings and tenant_users
- tenant_launch_checklists
- notification_events
- customer_accounts
- customer_favourites
- customer_push_subscriptions
- admin_push_subscriptions
- tenant_subscription_payments
- referral_sources
- referral_signups
- referral_rewards
- referral_reward_credits
- tenants

It also attempts to remove tenant storage folders from:

- tenant-assets/<tenant-slug>
- product-images/<tenant-slug>

Storage cleanup warnings are returned as non-fatal step warnings so the database delete can still complete.

## Supabase SQL

No Supabase SQL required.
