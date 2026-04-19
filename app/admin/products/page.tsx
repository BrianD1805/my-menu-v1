import ProductManager from "@/components/admin/ProductManager";
import { db } from "@/lib/db";
import { requireAdminPageUser } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

export default async function AdminProductsPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);

  const { data: categories } = await db
    .from("categories")
    .select("id, name")
    .eq("tenant_id", tenant.id)
    .order("sort_order", { ascending: true });

  const categoryMap = new Map((categories || []).map((category) => [category.id, category.name]));

  const { data: products } = await db
    .from("products")
    .select("id, name, description, image_url, price, is_active, category_id")
    .eq("tenant_id", tenant.id)
    .order("name", { ascending: true });

  const productRows = (products || []).map((product) => ({
    ...product,
    category_name: categoryMap.get(product.category_id) || null,
  }));

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      signedInAs={user.full_name || user.email || "Owner"}
      current="products"
      title="Products"
      logoUrl={branding.logoUrl}
      accentColor={branding.accentColor}
      description="Manage products, images, and rich descriptions for this tenant only."
    >
      <div className="mb-6 rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
        This product list is tenant-specific. Use the popup tools to search, add, edit, and manage images for this tenant only.
      </div>

      <ProductManager products={productRows} categories={categories || []} moneySettings={branding} />
    </AdminShell>
  );
}
