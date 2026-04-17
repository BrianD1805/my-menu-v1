Orduva Ver-0.062 handover

Included in this patch:
- started Phase 2 owner login only foundation
- added tenant owner login page at /admin/login
- added session/cookie-based admin auth
- admin pages now require tenant owner login
- admin APIs now require tenant owner login
- login is tenant-bound to the current host/tenant
- added first-owner bootstrap flow on the login page using ADMIN_ACCESS_KEY
- added Supabase SQL setup file for tenant_users table
- visible version bumped to Ver: 0.062

Important setup before testing:
1. Run SUPABASE_TENANT_OWNER_LOGIN_SETUP.sql in Supabase
2. Make sure ADMIN_ACCESS_KEY is set in Netlify
3. Add ORDUVA_AUTH_SECRET in Netlify for signed owner sessions
4. Visit /admin/login on the tenant and use First owner setup once for that tenant

What this enables:
- one owner login per tenant foundation
- tenant-specific admin sign-in
- tenant owner only reaches that tenant's admin
- logout flow
