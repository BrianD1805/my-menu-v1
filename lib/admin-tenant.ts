import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApiUser } from "@/lib/admin-auth";

type TenantShape = { id: string; slug: string; name: string };
type UserShape = { id: string; email: string | null };
type CategoryShape = { id: string; tenant_id: string };
type ProductShape = { id: string; tenant_id: string; category_id: string | null; image_url: string | null };

type ResultError = { ok: false; error: NextResponse };
type AdminTenantSuccess = { ok: true; tenant: TenantShape; user: UserShape };
type AdminCategorySuccess = { ok: true; category: CategoryShape };
type AdminProductSuccess = { ok: true; product: ProductShape };

export type AdminTenantResult = AdminTenantSuccess | ResultError;
export type AdminCategoryResult = AdminCategorySuccess | ResultError;
export type AdminProductResult = AdminProductSuccess | ResultError;

export async function resolveAdminTenant(req: Request): Promise<AdminTenantResult> {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) {
    return { ok: false, error: auth.error };
  }

  return { ok: true, tenant: auth.tenant, user: auth.user };
}

export async function getTenantCategoryForAdmin(categoryId: string, tenantId: string): Promise<AdminCategoryResult> {
  const { data: category, error } = await db
    .from("categories")
    .select("id, tenant_id")
    .eq("id", categoryId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !category) {
    return { ok: false, error: NextResponse.json({ error: "Category not found for this tenant" }, { status: 404 }) };
  }

  return { ok: true, category };
}

export async function getTenantProductForAdmin(productId: string, tenantId: string): Promise<AdminProductResult> {
  const { data: product, error } = await db
    .from("products")
    .select("id, tenant_id, category_id, image_url")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !product) {
    return { ok: false, error: NextResponse.json({ error: "Product not found for this tenant" }, { status: 404 }) };
  }

  return { ok: true, product };
}
