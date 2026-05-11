# Orduva Ver-0.204C — Tenant settings M-Pesa type fix

Fixes the next TypeScript build error in `lib/storefront-payment-options.ts` by adding the M-Pesa compatibility fields to the shared `TenantSettings` types.

Added optional fields:

- `enable_mpesa_customer_payments`
- `mpesa_connection_status`
- `mpesa_customer_payments_live`

This is a TypeScript compatibility patch only. No Supabase SQL is required.
