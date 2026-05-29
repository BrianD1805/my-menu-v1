# Orduva Ver-0.194A — billing return/status polish

Changes included in this patch:

- Removed the owner-platform button from the Stripe billing success page.
- Kept the success and cancel pages in place for live customer returns.
- Fixed the tenant admin billing popup so active subscriptions show `Billing` under the header pill instead of `Trial`.
- Updated the popup title from `Trial details` to `Billing details` for active subscriptions.
- Fixed Recent Stripe payment records so the visible date shows the actual payment record created date/time instead of the billing period month.
- Bumped visible version to `Ver: 0.194A`.
- Bumped storefront/service-worker cache strings to `ver-0-194a`.

No Supabase SQL is required.
