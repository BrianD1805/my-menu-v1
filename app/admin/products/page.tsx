import ProductManager from "@/components/admin/ProductManager";
import { db } from "@/lib/db";
import { requireAdminPageUser } from "@/lib/admin-auth";
import AdminShell from "@/components/admin/AdminShell";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { calculateTenantTrialState } from "@/lib/trial";

export default async function AdminProductsPage() {
  const { tenant, user } = await requireAdminPageUser();
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  const trialState = calculateTenantTrialState(tenant);

  const { data: categories } = await db
    .from("categories")
    .select("id, name")
    .eq("tenant_id", tenant.id)
    .order("sort_order", { ascending: true });

  const categoryMap = new Map(
    (categories || []).map((category) => [category.id, category.name]),
  );

  const { data: products } = await db
    .from("products")
    .select(
      "id, name, description, image_url, price, is_active, category_id, secondary_category_id, stock_enabled, stock_quantity, low_stock_threshold, variants_enabled, variant_label, product_variants, product_type, custom_amount_enabled, custom_amount_label, custom_amount_reference_label, custom_amount_reference_required, custom_amount_min, custom_amount_max, custom_amount_help_text, custom_amount_disable_rewards, custom_amount_disable_discounts, preorder_enabled, preorder_when_out_of_stock, product_requires_variant",
    )
    .eq("tenant_id", tenant.id)
    .order("name", { ascending: true });

  const productRows = (products || []).map((product) => ({
    ...product,
    category_name: categoryMap.get(product.category_id) || null,
    secondary_category_name:
      categoryMap.get(product.secondary_category_id || "") || null,
  }));

  return (
    <AdminShell
      tenantName={branding.adminHeadingLabel}
      tenantSlug={tenant.slug}
      signedInAs={user.full_name || user.email || "Owner"}
      current="products"
      title="Products"
      logoUrl={branding.logoUrl}
      faviconUrl={branding.faviconUrl}
      accentColor={branding.accentColor}
      trialState={trialState}
      description="Manage products, images, and rich descriptions for this tenant only."
    >
      <div className="mb-6 rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
        This product list is tenant-specific. Use the popup tools to search,
        add, edit, and manage images for this tenant only.
      </div>

      <ProductManager
        products={productRows}
        categories={categories || []}
        moneySettings={branding}
      />
    </AdminShell>
  );
}
