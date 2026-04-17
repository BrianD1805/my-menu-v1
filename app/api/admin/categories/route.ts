import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantCategoryForAdmin, resolveAdminTenant } from "@/lib/admin-tenant";

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
    const name = normalizeName(body?.name);
    const sortOrder = normalizeSortOrder(body?.sortOrder);

    if (!name) {
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    }

    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;
    const tenant = tenantLookup.tenant!;

    const { data: category, error } = await db
      .from("categories")
      .insert({ tenant_id: tenant.id, name, sort_order: sortOrder })
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
    const categoryId = String(body?.categoryId || "").trim();
    const name = normalizeName(body?.name);
    const sortOrder = normalizeSortOrder(body?.sortOrder);

    if (!categoryId || !name) {
      return NextResponse.json({ error: "Missing categoryId or name" }, { status: 400 });
    }

    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;
    const tenant = tenantLookup.tenant!;

    const categoryLookup = await getTenantCategoryForAdmin(categoryId, tenant.id);
    if (!categoryLookup.ok) return categoryLookup.error;

    const { data: category, error } = await db
      .from("categories")
      .update({ name, sort_order: sortOrder })
      .eq("id", categoryId)
      .eq("tenant_id", tenant.id)
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
    const categoryId = String(body?.categoryId || "").trim();

    if (!categoryId) {
      return NextResponse.json({ error: "Missing categoryId" }, { status: 400 });
    }

    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;
    const tenant = tenantLookup.tenant!;

    const categoryLookup = await getTenantCategoryForAdmin(categoryId, tenant.id);
    if (!categoryLookup.ok) return categoryLookup.error;

    const { count, error: countError } = await db
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
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
      .eq("tenant_id", tenant.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
