import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type PushSubscriptionPayload = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

type VerifyBody = {
  tenantSlug?: string;
  orderId?: string;
  customerPhone?: string;
  customerName?: string;
};

async function verifyOrderAccess(body: VerifyBody) {
  const tenantSlug = String(body.tenantSlug || "").trim();
  const orderId = String(body.orderId || "").trim();
  const customerPhone = String(body.customerPhone || "").trim();

  if (!tenantSlug || !orderId || !customerPhone) {
    return { ok: false as const, error: NextResponse.json({ error: "Missing tenant, order, or customer phone." }, { status: 400 }) };
  }

  const { data: tenant } = await db.from("tenants").select("id,slug").eq("slug", tenantSlug).single();
  if (!tenant) {
    return { ok: false as const, error: NextResponse.json({ error: "Tenant not found." }, { status: 404 }) };
  }

  const { data: order } = await db
    .from("orders")
    .select("id,tenant_id,customer_phone,customer_name,status")
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .single();

  if (!order) {
    return { ok: false as const, error: NextResponse.json({ error: "Order not found." }, { status: 404 }) };
  }

  if (String(order.customer_phone || "").trim() !== customerPhone) {
    return { ok: false as const, error: NextResponse.json({ error: "Customer details do not match this order." }, { status: 403 }) };
  }

  return { ok: true as const, tenant, order };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantSlug = url.searchParams.get("tenantSlug") || "";
  const orderId = url.searchParams.get("orderId") || "";
  const customerPhone = url.searchParams.get("customerPhone") || "";
  const verification = await verifyOrderAccess({ tenantSlug, orderId, customerPhone });
  if (!verification.ok) return verification.error;

  const { count, error } = await db
    .from("customer_push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("order_id", verification.order.id)
    .eq("enabled", true);

  return NextResponse.json({
    ok: !error,
    activeSubscriptions: error ? 0 : count || 0,
    vapidConfigured: Boolean(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
        process.env.VAPID_PRIVATE_KEY?.trim() &&
        process.env.VAPID_SUBJECT?.trim()
    ),
    orderStatus: verification.order.status,
    error: error ? `Could not load customer device status: ${error.message}` : undefined,
  }, { status: error ? 500 : 200 });
}

export async function POST(req: Request) {
  const body = (await req.json()) as VerifyBody & { subscription?: PushSubscriptionPayload };
  const verification = await verifyOrderAccess(body);
  if (!verification.ok) return verification.error;

  const subscription = body.subscription;
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "Invalid push subscription payload." }, { status: 400 });
  }

  const payload = {
    tenant_id: verification.tenant.id,
    order_id: verification.order.id,
    customer_name: String(body.customerName || verification.order.customer_name || "").trim() || null,
    customer_phone: String(body.customerPhone || verification.order.customer_phone || "").trim(),
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    user_agent: req.headers.get("user-agent") || null,
    enabled: true,
    updated_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };

  const { error } = await db.from("customer_push_subscriptions").upsert(payload, { onConflict: "tenant_id,endpoint" });

  if (error) {
    return NextResponse.json({ error: `Failed to save customer push subscription: ${error.message}` }, { status: 500 });
  }

  const { count } = await db
    .from("customer_push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("order_id", verification.order.id)
    .eq("enabled", true);

  return NextResponse.json({
    ok: true,
    message: "This device is now saved for customer order push updates.",
    activeSubscriptions: count || 0,
  });
}

export async function DELETE(req: Request) {
  const body = (await req.json()) as VerifyBody & { endpoint?: string };
  const verification = await verifyOrderAccess(body);
  if (!verification.ok) return verification.error;
  const endpoint = String(body.endpoint || "").trim();
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint." }, { status: 400 });

  const { error } = await db
    .from("customer_push_subscriptions")
    .update({
      enabled: false,
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .eq("order_id", verification.order.id)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: `Failed to disable customer push subscription: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
