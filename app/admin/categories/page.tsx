import CategoryManager from "@/components/admin/CategoryManager";
import { db } from "@/lib/db";
import { requireAdminPageUser } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

export default async function AdminCategoriesPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);

  const { data: categories } = await db
    .from("categories")
    .select("id, name, sort_order")
    .eq("tenant_id", tenant.id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const { data: products } = await db
    .from("products")
    .select("id, category_id")
    .eq("tenant_id", tenant.id);

  const productCountByCategory = new Map<string, number>();
  for (const product of products || []) {
    productCountByCategory.set(product.category_id, (productCountByCategory.get(product.category_id) || 0) + 1);
  }

  const categoryRows = (categories || []).map((category) => ({
    ...category,
    product_count: productCountByCategory.get(category.id) || 0,
  }));

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      signedInAs={user.full_name || user.email || "Owner"}
      current="categories"
      title="Categories"
      logoUrl={branding.logoUrl}
      accentColor={branding.accentColor}
      description="Add, rename, reorder, and safely remove categories for this tenant only."
    >
      <div className="mb-6 rounded-[24px] border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
        You can add and reorder categories here. Deleting a category is blocked if products still belong to it.
      </div>

      <CategoryManager categories={categoryRows} />
    </AdminShell>
  );
}
