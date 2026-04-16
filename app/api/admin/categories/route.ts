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

async function getCategoryForTenant(categoryId: string, tenantId: string) {
  const { data: category, error } = await db
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !category) {
    return { error: NextResponse.json({ error: "Category not found" }, { status: 404 }) };
  }

  return { category };
}

function normalizeName(value: unknown) {
  return String(value || "").trim();
}

function normalizeSortOrder(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.trunc(num);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const tenantSlug = String(body?.tenantSlug || "").trim();
    const name = normalizeName(body?.name);
    const sortOrder = normalizeSortOrder(body?.sortOrder);

    if (!tenantSlug || !name) {
      return NextResponse.json({ error: "Missing tenantSlug or name" }, { status: 400 });
    }

    const tenantLookup = await getTenantId(tenantSlug);
    if (tenantLookup.error) return tenantLookup.error;
    const tenantId = tenantLookup.tenantId!;

    const { data: category, error } = await db
      .from("categories")
      .insert({ tenant_id: tenantId, name, sort_order: sortOrder })
      .select("id, name, sort_order")
      .single();

    if (error || !category) {
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const tenantSlug = String(body?.tenantSlug || "").trim();
    const categoryId = String(body?.categoryId || "").trim();
    const name = normalizeName(body?.name);
    const sortOrder = normalizeSortOrder(body?.sortOrder);

    if (!tenantSlug || !categoryId || !name) {
      return NextResponse.json({ error: "Missing tenantSlug, categoryId, or name" }, { status: 400 });
    }

    const tenantLookup = await getTenantId(tenantSlug);
    if (tenantLookup.error) return tenantLookup.error;
    const tenantId = tenantLookup.tenantId!;

    const categoryLookup = await getCategoryForTenant(categoryId, tenantId);
    if (categoryLookup.error) return categoryLookup.error;

    const { data: category, error } = await db
      .from("categories")
      .update({ name, sort_order: sortOrder })
      .eq("id", categoryId)
      .eq("tenant_id", tenantId)
      .select("id, name, sort_order")
      .single();

    if (error || !category) {
      return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const tenantSlug = String(body?.tenantSlug || "").trim();
    const categoryId = String(body?.categoryId || "").trim();

    if (!tenantSlug || !categoryId) {
      return NextResponse.json({ error: "Missing tenantSlug or categoryId" }, { status: 400 });
    }

    const tenantLookup = await getTenantId(tenantSlug);
    if (tenantLookup.error) return tenantLookup.error;
    const tenantId = tenantLookup.tenantId!;

    const categoryLookup = await getCategoryForTenant(categoryId, tenantId);
    if (categoryLookup.error) return categoryLookup.error;

    const { count, error: countError } = await db
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("category_id", categoryId);

    if (countError) {
      return NextResponse.json({ error: "Failed to check category usage" }, { status: 500 });
    }

    if ((count || 0) > 0) {
      return NextResponse.json(
        { error: `This category still has ${count} products. Move or delete those products first.` },
        { status: 400 }
      );
    }

    const { error } = await db
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("tenant_id", tenantId);

    if (error) {
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
