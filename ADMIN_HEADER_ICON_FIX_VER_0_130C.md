# Orduva Ver-0.130C — Admin Header Icon Fix

This patch fixes the visible top-left tenant admin header icon.

The previous Ver-0.130B patch fixed browser favicon, manifest, and PWA icon references, but the admin shell header was still rendering the tenant logo when a tenant logo existed.

Ver-0.130C forces the visible admin header brand mark to use the Orduva platform icon on all tenant admin pages that use the shared AdminShell.

No storefront, checkout, customer, order, push, wildcard, or onboarding logic was changed.
