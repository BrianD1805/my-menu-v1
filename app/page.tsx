import CartButton from "@/components/menu/CartButton";
import MenuBrowser from "@/components/menu/MenuBrowser";
import { db } from "@/lib/db";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";
import { LIVE_VERSION } from "@/lib/version";

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
    <main className="mx-auto min-h-screen max-w-7xl p-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500">Storefront</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-3xl font-bold">{tenant.name}</h1>
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700">
              {LIVE_VERSION}
            </span>
          </div>
          <p className="mt-1 text-gray-600">Simple online ordering demo</p>
        </div>
        <div className="flex gap-3">
          <CartButton tenantSlug={slug} />
          <a href="/admin/orders" className="rounded-xl border px-5 py-3">
            Admin orders
          </a>
        </div>
      </div>

      <MenuBrowser tenantSlug={slug} categories={categories || []} products={products || []} />
    </main>
  );
}
