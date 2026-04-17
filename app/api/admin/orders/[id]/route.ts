import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveAdminTenant } from "@/lib/admin-tenant";

const allowedStatuses = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    if (!body.status || !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const tenantLookup = await resolveAdminTenant(req);
    if (tenantLookup.error) return tenantLookup.error;
    const tenant = tenantLookup.tenant!;

    const { data: order, error: orderError } = await db
      .from("orders")
      .select("id, tenant_id")
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found for this tenant" }, { status: 404 });
    }

    const { data, error } = await db
      .from("orders")
      .update({ status: body.status })
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, order: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
