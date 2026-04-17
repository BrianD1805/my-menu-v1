import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveTenantSlugFromRequest } from "@/lib/tenant-server";
import { requireAdminApiUser } from "@/lib/admin-auth";

export async function resolveAdminTenant(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ((auth as { error?: NextResponse }).error) {
    return auth as { error: NextResponse };
  }

  const tenantSlug = resolveTenantSlugFromRequest(req);

  if (!tenantSlug) {
    return { error: NextResponse.json({ error: "Tenant could not be resolved" }, { status: 400 }) };
  }

  const { data: tenant, error } = await db
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", tenantSlug)
    .single();

  if (error || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
  }

  return { tenant, user: (auth as { user: { id: string; email: string | null } }).user };
}

export async function getTenantCategoryForAdmin(categoryId: string, tenantId: string) {
  const { data: category, error } = await db
    .from("categories")
    .select("id, tenant_id")
    .eq("id", categoryId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !category) {
    return { error: NextResponse.json({ error: "Category not found for this tenant" }, { status: 404 }) };
  }

  return { category };
}

export async function getTenantProductForAdmin(productId: string, tenantId: string) {
  const { data: product, error } = await db
    .from("products")
    .select("id, tenant_id, category_id, image_url")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !product) {
    return { error: NextResponse.json({ error: "Product not found for this tenant" }, { status: 404 }) };
  }

  return { product };
}
