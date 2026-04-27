import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateCustomerRequestSession } from "@/lib/customer-auth";

function extractItemsSummary(raw: any): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      const name = item?.product_name || item?.name || item?.productName || item?.title || "";
      const qty = Number(item?.quantity || 0);
      return name ? `${qty > 0 ? `${qty} × ` : ""}${name}` : "";
    })
    .filter(Boolean);
}

export async function GET(req: Request) {
  const session = await validateCustomerRequestSession(req);
  if (!session) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data, error } = await db
    .from("orders")
    .select(
      `
      id,
      created_at,
      total,
      status,
      order_type,
      customer_name,
      customer_phone,
      customer_address,
      notes,
      order_items (
        product_name,
        quantity,
        line_total
      )
    `
    )
    .eq("tenant_id", session.tenant.id)
    .eq("customer_account_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    return NextResponse.json({ error: error.message || "Could not load orders." }, { status: 500 });
  }

  const orders = (data || []).map((row: any) => ({
    id: row.id,
    createdAt: row.created_at,
    total: Number(row.total || 0),
    status: row.status || "new",
    orderType: row.order_type || null,
    customerName: row.customer_name || null,
    customerPhone: row.customer_phone || null,
    notes: row.notes || null,
    address: row.customer_address || null,
    itemsSummary: extractItemsSummary(row.order_items),
  }));

  return NextResponse.json({ ok: true, orders });
}
