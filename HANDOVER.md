Orduva Ver-0.061 handover

Included in this patch:
- finished the remaining Phase 1 admin/API tenant audit pass
- moved admin product image update/upload into a protected admin route
- added /api/admin/products/image for tenant-scoped product image changes
- public /api/products is now read-only for storefront product loading
- removed remaining client-side tenantSlug assumptions from admin product/category CRUD calls
- admin product and category pages now rely on server-side tenant resolution only
- live version bumped to Ver: 0.061

Why this matters:
- image upload and image URL changes are no longer exposed on a public API path
- admin CRUD no longer sends tenantSlug from the browser for trust decisions
- this closes a major remaining Phase 1 tenant-safety gap before Phase 2 login
