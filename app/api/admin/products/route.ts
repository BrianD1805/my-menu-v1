import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function getTenantId(tenantSlug: string) {
  const { data: tenant, error } = await db
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (error || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
  }

  return { tenantId: tenant.id as string };
}

async function getProductForTenant(productId: string, tenantId: string) {
  const { data: product, error } = await db
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !product) {
    return { error: NextResponse.json({ error: "Product not found" }, { status: 404 }) };
  }

  return { product };
}

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
    const tenantSlug = String(body?.tenantSlug || "").trim();
    const name = normalizeName(body?.name);
    const description = normalizeDescription(body?.description);
    const categoryId = normalizeCategory(body?.categoryId);
    const price = normalizePrice(body?.price);
    const isActive = normalizeActive(body?.isActive);
    const imageUrl = normalizeImageUrl(body?.imageUrl);

    if (!tenantSlug || !name || !categoryId || price === null) {
      return NextResponse.json({ error: "Missing tenantSlug, name, categoryId, or valid price" }, { status: 400 });
    }

    const tenantLookup = await getTenantId(tenantSlug);
    if (tenantLookup.error) return tenantLookup.error;
    const tenantId = tenantLookup.tenantId!;

    const { data: category, error: categoryError } = await db
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("tenant_id", tenantId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ error: "Category not found for tenant" }, { status: 400 });
    }

    const { data: product, error } = await db
      .from("products")
      .insert({
        tenant_id: tenantId,
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
    const tenantSlug = String(body?.tenantSlug || "").trim();
    const productId = String(body?.productId || "").trim();
    const name = normalizeName(body?.name);
    const description = normalizeDescription(body?.description);
    const categoryId = normalizeCategory(body?.categoryId);
    const price = normalizePrice(body?.price);
    const isActive = normalizeActive(body?.isActive);
    const imageUrl = normalizeImageUrl(body?.imageUrl);

    if (!tenantSlug || !productId || !name || !categoryId || price === null) {
      return NextResponse.json({ error: "Missing tenantSlug, productId, name, categoryId, or valid price" }, { status: 400 });
    }

    const tenantLookup = await getTenantId(tenantSlug);
    if (tenantLookup.error) return tenantLookup.error;
    const tenantId = tenantLookup.tenantId!;

    const productLookup = await getProductForTenant(productId, tenantId);
    if (productLookup.error) return productLookup.error;

    const { data: category, error: categoryError } = await db
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("tenant_id", tenantId)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ error: "Category not found for tenant" }, { status: 400 });
    }

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
      .eq("tenant_id", tenantId)
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
    const tenantSlug = String(body?.tenantSlug || "").trim();
    const productId = String(body?.productId || "").trim();

    if (!tenantSlug || !productId) {
      return NextResponse.json({ error: "Missing tenantSlug or productId" }, { status: 400 });
    }

    const tenantLookup = await getTenantId(tenantSlug);
    if (tenantLookup.error) return tenantLookup.error;
    const tenantId = tenantLookup.tenantId!;

    const productLookup = await getProductForTenant(productId, tenantId);
    if (productLookup.error) return productLookup.error;

    const { error } = await db
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
