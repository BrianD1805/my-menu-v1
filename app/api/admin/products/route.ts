import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantCategoryForAdmin, getTenantProductForAdmin, resolveAdminTenant } from "@/lib/admin-tenant";

function normalizeName(value: unknown) {
  return String(value || "").trim();
}

function normalizeDescription(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeImageUrl(value: unknown) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeCategory(value: unknown) {
  return String(value || "").trim();
}

function normalizePrice(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Number(num.toFixed(2));
}

function normalizeActive(value: unknown) {
  return value === true || value === "true" || value === "1" || value === 1;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = normalizeName(body?.name);
    const description = normalizeDescription(body?.description);
    const categoryId = normalizeCategory(body?.categoryId);
    const price = normalizePrice(body?.price);
    const isActive = normalizeActive(body?.isActive);
    const imageUrl = normalizeImageUrl(body?.imageUrl);

    if (!name || !categoryId || price === null) {
      return NextResponse.json({ error: "Missing name, categoryId, or valid price" }, { status: 400 });
    }

    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;
    const tenant = tenantLookup.tenant!;

    const categoryLookup = await getTenantCategoryForAdmin(categoryId, tenant.id);
    if (!categoryLookup.ok) return categoryLookup.error;

    const { data: product, error } = await db
      .from("products")
      .insert({
        tenant_id: tenant.id,
        category_id: categoryId,
        name,
        description,
        image_url: imageUrl,
        price,
        is_active: isActive,
      })
      .select("id, name, description, image_url, price, is_active, category_id")
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const productId = String(body?.productId || "").trim();
    const name = normalizeName(body?.name);
    const description = normalizeDescription(body?.description);
    const categoryId = normalizeCategory(body?.categoryId);
    const price = normalizePrice(body?.price);
    const isActive = normalizeActive(body?.isActive);
    const imageUrl = normalizeImageUrl(body?.imageUrl);

    if (!productId || !name || !categoryId || price === null) {
      return NextResponse.json({ error: "Missing productId, name, categoryId, or valid price" }, { status: 400 });
    }

    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;
    const tenant = tenantLookup.tenant!;

    const productLookup = await getTenantProductForAdmin(productId, tenant.id);
    if (!productLookup.ok) return productLookup.error;

    const categoryLookup = await getTenantCategoryForAdmin(categoryId, tenant.id);
    if (!categoryLookup.ok) return categoryLookup.error;

    const { data: product, error } = await db
      .from("products")
      .update({
        name,
        description,
        category_id: categoryId,
        image_url: imageUrl,
        price,
        is_active: isActive,
      })
      .eq("id", productId)
      .eq("tenant_id", tenant.id)
      .select("id, name, description, image_url, price, is_active, category_id")
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const productId = String(body?.productId || "").trim();

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;
    const tenant = tenantLookup.tenant!;

    const productLookup = await getTenantProductForAdmin(productId, tenant.id);
    if (!productLookup.ok) return productLookup.error;

    const { error } = await db
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("tenant_id", tenant.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
