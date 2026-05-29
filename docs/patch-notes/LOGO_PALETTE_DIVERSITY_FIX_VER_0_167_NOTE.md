# Orduva Ver-0.167 — logo palette diversity fix

This patch improves the tenant admin logo colour palette generator for multi-colour logos.

## Included

- Re-applies the Ver-0.166 storefront footer icon layout polish because this patch is built from Ver-0.165D in the current sandbox
- Reduces over-sampling of pale cream, near-white, near-black and low-saturation pixels
- Gives stronger saturated brand colours more weight than simple pixel-count ranking
- Groups candidate colours by hue family so one dominant logo area cannot fill the whole palette
- Keeps up to 8 distinct generated logo colours
- Preserves the existing Logo palette preset workflow
- Bumps the live version to Ver: 0.167

## Not changed

- Storefront product card layout
- Checkout flow
- Wildcard routing
- Supabase schema
