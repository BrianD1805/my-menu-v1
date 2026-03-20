import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveTenantSlugFromRequest } from "@/lib/tenant";

const allowedStatuses = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled"
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

    const tenantSlug = resolveTenantSlugFromRequest(req);

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .select("id")
      .eq("slug", tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { data, error } = await db
      .from("orders")
      .update({ status: body.status })
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, order: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
