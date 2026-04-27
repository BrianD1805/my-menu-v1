# Orduva Ver-0.118 — saved customer profile/address + checkout prefill

This patch builds on the confirmed Ver-0.117 stable checkpoint.

## What changed
- Bumped app version to `Ver: 0.118`.
- Improved signed-in checkout prefill from the saved customer profile.
- Checkout now builds the saved address from address line 1, address line 2, city, and postcode/area.
- Added a `Use saved details` action on checkout for signed-in customers.
- Added a checked-by-default option to save checkout name, phone, and address back to the customer account.
- Improved the account page address summary so it shows the full saved address, not only address line 1.
- Changed the account edit modal footer from sticky to normal bottom-of-form buttons to avoid mobile popup awkwardness.

## Scope protection
- Product cards were not changed.
- Admin push logic was not changed.
- Order persistence/customer_account_id logic was not changed, except checkout continues to pass the signed-in customer account id.
