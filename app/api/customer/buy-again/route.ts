import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCustomerRequestSession } from "@/lib/customer-auth";

function uniqueOrderedProductIds(rows: any[]): string[] {
  const seen = new Set<string>();
  const productIds: string[] = [];

  for (const order of rows || []) {
    const items = Array.isArray(order?.order_items) ? order.order_items : [];
    for (const item of items) {
      const productId = String(item?.product_id || "").trim();
      if (!productId || seen.has(productId)) continue;
      seen.add(productId);
      productIds.push(productId);
    }
  }

  return productIds;
}

export async function GET(req: Request) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ ok: false, productIds: [] }, { status: 401 });
  }

  const { data, error } = await db
    .from("orders")
    .select(
      `
      id,
      created_at,
      order_items (
        product_id
      )
    `
    )
    .eq("tenant_id", session.tenant.id)
    .eq("customer_account_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: error.message || "Could not load previous purchases." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, productIds: uniqueOrderedProductIds(data || []).slice(0, 24) });
}
