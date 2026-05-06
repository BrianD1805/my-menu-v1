# Ver-0.169J — mobile splash speed pass

This patch changes the tenant storefront so the first mobile paint is no longer blocked by the full Supabase storefront data load.

Previously the root server route waited for:

- tenant lookup
- tenant settings
- categories
- products

Only after those finished could the browser paint the storefront. On mobile/PWA launches, that meant the native splash screen could remain visible until Supabase/Netlify finished the server render.

Now the tenant page resolves only the tenant slug on the server and immediately returns a lightweight client storefront loader. The loader then fetches settings, categories and products from `/api/products` in the browser and renders `MenuBrowser` once data arrives.

Customer login and favourites still load after the menu shell, as before.

No Supabase SQL required.
