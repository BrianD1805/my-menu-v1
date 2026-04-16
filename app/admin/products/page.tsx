import ProductManager from "@/components/admin/ProductManager";
import { db } from "@/lib/db";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";

export default async function AdminProductsPage() {
  const slug = await resolveTenantSlug();
  const tenant = await getTenantBySlug(slug);

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
    <main className="mx-auto min-h-screen max-w-6xl p-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">Admin</p>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="mt-1 text-gray-600">
            Add, edit, delete, and manage live product images for {tenant.name}.
          </p>
        </div>

        <div className="flex gap-3">
          <a href="/admin/orders" className="rounded-xl border px-5 py-3">
            Admin orders
          </a>
          <a href="/" className="rounded-xl border px-5 py-3">
            View storefront
          </a>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
        Manage the live product list here. You can add new products, edit existing ones, change categories, update prices, delete products, and manage images.
      </div>

      <ProductManager tenantSlug={slug} products={productRows} categories={categories || []} />
    </main>
  );
}
