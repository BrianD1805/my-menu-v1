import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function getTenantId(tenantSlug: string) {
  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .select("id")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
  }

  return { tenantId: tenant.id };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");

  if (!tenantSlug) {
    return NextResponse.json({ error: "Missing tenantSlug" }, { status: 400 });
  }

  const tenantLookup = await getTenantId(tenantSlug);
  if (tenantLookup.error) return tenantLookup.error;

  const { data: products, error } = await db
    .from("products")
    .select("id, name, description, image_url, price, is_active, category_id")
    .eq("tenant_id", tenantLookup.tenantId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }

  return NextResponse.json({ products });
}
