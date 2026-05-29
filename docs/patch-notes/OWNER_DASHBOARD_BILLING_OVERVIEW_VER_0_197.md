# Orduva Ver-0.197 — Owner dashboard billing overview

Milestone: Owner Billing Finished has now been followed by an owner-level billing overview on the platform dashboard.

## Added

- New owner/platform API endpoint:
  - `/api/platform/billing-overview`
- New owner dashboard component:
  - `components/admin/OwnerBillingOverviewPanel.tsx`
- The main `/platform` dashboard now shows a Billing overview panel above the existing Store overview panel.

## What the overview shows

- Active billing tenants
- Trial tenants
- Payment attention tenants
- Expired/cancelled tenants
- Active tenants missing Stripe customer/subscription links
- Current calendar month Stripe payment totals by currency
- Last 30 days Stripe payment totals by currency
- Recent Stripe payment records
- Tenant-level billing rows with plan, provider, local status, Stripe link status and latest payment

## Technical notes

- This dashboard reads Orduva's own Supabase billing tables and tenant records.
- It does not make live Stripe API calls for every tenant, so the page remains fast and avoids unnecessary Stripe rate/API overhead.
- Payment totals are based on `tenant_subscription_payments` records created by Stripe webhook processing.
- Stripe link status is based on tenant fields:
  - `billing_customer_id`
  - `billing_subscription_id`
- No new Supabase SQL is required for this patch.

## Testing

After deploy:

1. Open `/platform`.
2. Confirm the new Billing overview panel appears above Store overview.
3. Confirm totals show for active billing, trials and payment attention.
4. Confirm recent payment records show the real paid date/time.
5. Click each billing filter card and confirm the tenant list changes correctly.
6. Confirm the existing Store overview still loads below it.
