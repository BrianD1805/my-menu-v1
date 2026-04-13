import ProductCard from "@/components/menu/ProductCard";
import { db } from "@/lib/db";
import { getTenantBySlug } from "@/lib/tenant";
import { resolveTenantSlug } from "@/lib/tenant-server";

export default async function HomePage() {
  const slug = await resolveTenantSlug();
  const tenant = await getTenantBySlug(slug);

  const { data: categories } = await db
    .from("categories")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("sort_order", { ascending: true });

  const { data: products } = await db
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true);

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">Storefront</p>
          <h1 className="text-3xl font-bold">{tenant.name}</h1>
          <p className="mt-1 text-gray-600">Simple tenant-aware online ordering demo</p>
        </div>
        <div className="flex gap-3">
          <a href="/checkout" className="rounded-xl bg-green-600 px-5 py-3 text-white">
            Go to checkout
          </a>
          <a href="/admin/orders" className="rounded-xl border px-5 py-3">
            Admin orders
          </a>
        </div>
      </div>

      {categories?.map((category) => {
        const categoryProducts = products?.filter((p) => p.category_id === category.id) || [];

        return (
          <section key={category.id} className="mb-10">
            <h2 className="mb-4 text-2xl font-semibold">{category.name}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {categoryProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  price={Number(product.price)}
                  tenantSlug={slug}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
