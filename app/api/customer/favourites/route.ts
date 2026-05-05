import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCustomerRequestSession } from "@/lib/customer-auth";

function cleanProductId(value: unknown) {
  return String(value || "").trim();
}

async function productBelongsToTenant(productId: string, tenantId: string) {
  const { data, error } = await db
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return false;
  return true;
}

export async function GET(req: Request) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, productIds: [] }, { status: 401 });
  }

  const { data, error } = await db
    .from("customer_favourites")
    .select("product_id, created_at")
    .eq("tenant_id", session.tenant.id)
    .eq("customer_account_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message || "Could not load favourites." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    productIds: (data || []).map((row: { product_id: string }) => row.product_id),
  });
}

export async function POST(req: Request) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Please sign in to save favourites." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const productId = cleanProductId(body?.productId);
  if (!productId) {
    return NextResponse.json({ error: "Missing product ID." }, { status: 400 });
  }

  const validProduct = await productBelongsToTenant(productId, session.tenant.id);
  if (!validProduct) {
    return NextResponse.json({ error: "Product not found for this store." }, { status: 404 });
  }

  const { data: existing, error: lookupError } = await db
    .from("customer_favourites")
    .select("id")
    .eq("tenant_id", session.tenant.id)
    .eq("customer_account_id", session.user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message || "Could not check favourite.", details: lookupError.details || null, code: lookupError.code || null }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ ok: true, productId, alreadySaved: true });
  }

  const { error } = await db
    .from("customer_favourites")
    .insert({
      tenant_id: session.tenant.id,
      customer_account_id: session.user.id,
      product_id: productId,
    });

  if (error) {
    const duplicate = error.code === "23505";
    if (duplicate) {
      return NextResponse.json({ ok: true, productId, alreadySaved: true });
    }
    return NextResponse.json({ error: error.message || "Could not save favourite.", details: error.details || null, code: error.code || null }, { status: 500 });
  }

  return NextResponse.json({ ok: true, productId });
}

export async function DELETE(req: Request) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Please sign in to update favourites." }, { status: 401 });
  }

  const url = new URL(req.url);
  const productId = cleanProductId(url.searchParams.get("productId"));
  if (!productId) {
    return NextResponse.json({ error: "Missing product ID." }, { status: 400 });
  }

  const { error } = await db
    .from("customer_favourites")
    .delete()
    .eq("tenant_id", session.tenant.id)
    .eq("customer_account_id", session.user.id)
    .eq("product_id", productId);

  if (error) {
    return NextResponse.json({ error: error.message || "Could not remove favourite." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, productId });
}
