import CategoryManager from "@/components/admin/CategoryManager";
import { db } from "@/lib/db";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";

export default async function AdminCategoriesPage() {
  const slug = await resolveTenantSlug();
  const tenant = await getTenantBySlug(slug);

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
    <main className="mx-auto min-h-screen max-w-6xl p-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">Admin</p>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="mt-1 text-gray-600">Add, rename, reorder, and safely remove categories for {tenant.name} only.</p>
        </div>

        <div className="flex gap-3">
          <a href="/admin/products" className="rounded-xl border px-5 py-3">
            Admin products
          </a>
          <a href="/admin/orders" className="rounded-xl border px-5 py-3">
            Admin orders
          </a>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        You can add and reorder categories here. Deleting a category is blocked if products still belong to it.
      </div>

      <CategoryManager categories={categoryRows} />
    </main>
  );
}
