# Ver-0.170 — mobile storefront loading speed pass

This build moves the tenant storefront menu/settings/products load out of the first server-rendered storefront page and into a lightweight client loader so the mobile/PWA native splash is not held while Supabase menu data is fetched.

Follow-up polish in this same Ver-0.170 package removes the large visible "Opening your store / Loading the menu" container. During the brief client fetch, the storefront area now stays quiet with only the page background, then renders the normal MenuBrowser once the payload is available.

No Supabase SQL required.
