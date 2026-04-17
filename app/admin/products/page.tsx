import LogoutButton from "@/components/admin/LogoutButton";
import ProductManager from "@/components/admin/ProductManager";
import { db } from "@/lib/db";
import { requireAdminPageUser } from "@/lib/admin-auth";

export default async function AdminProductsPage() {
  const { tenant, user } = await requireAdminPageUser();

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
            Signed in as {user.full_name || user.email}. Manage products for {tenant.name}. Products, categories, images, and edits are all tied to this tenant only.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a href="/admin" className="rounded-xl border px-5 py-3">
            Admin home
          </a>
          <a href="/admin/orders" className="rounded-xl border px-5 py-3">
            Admin orders
          </a>
          <a href="/admin/categories" className="rounded-xl border px-5 py-3">
            Admin categories
          </a>
          <a href="/" className="rounded-xl border px-5 py-3">
            View storefront
          </a>
          <LogoutButton className="rounded-xl border px-5 py-3" />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
        This product list is tenant-specific. Use the popup tools to search, add, edit, and manage images for this tenant only.
      </div>

      <ProductManager products={productRows} categories={categories || []} />
    </main>
  );
}
