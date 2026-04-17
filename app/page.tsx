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
    <main className="mx-auto min-h-screen max-w-7xl overflow-x-clip px-4 pb-10 pt-0 sm:px-5 lg:px-6">
      <MenuBrowser
        tenantSlug={slug}
        tenantName={tenant.name}
        version={LIVE_VERSION}
        categories={categories || []}
        products={products || []}
      />
    </main>
  );
}
