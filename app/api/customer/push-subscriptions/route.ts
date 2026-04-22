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

async function resolveTenantId(orderId?: string | null, tenantId?: string | null) {
  if (tenantId) return tenantId;

  if (!orderId) return null;

  const { data } = await db
    .from("orders")
    .select("tenant_id")
    .eq("id", orderId)
    .maybeSingle();

  return data?.tenant_id || null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("orderId");
  const tenantId = url.searchParams.get("tenantId");
  const endpoint = url.searchParams.get("endpoint");

  const resolvedTenantId = await resolveTenantId(orderId, tenantId);
  if (!resolvedTenantId) {
    return NextResponse.json({
      ok: true,
      activeSubscriptions: 0,
      reusableDeviceRegistered: false,
      vapidConfigured: Boolean(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
        process.env.VAPID_PRIVATE_KEY?.trim() &&
        process.env.VAPID_SUBJECT?.trim()
      ),
    });
  }

  let query = db
    .from("customer_push_subscriptions")
    .select("id, endpoint, order_id", { count: "exact" })
    .eq("tenant_id", resolvedTenantId)
    .eq("enabled", true);

  if (endpoint) {
    query = query.eq("endpoint", endpoint);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({
      ok: false,
      error: `Could not load customer push status: ${error.message}`,
      activeSubscriptions: 0,
      reusableDeviceRegistered: false,
      vapidConfigured: Boolean(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
        process.env.VAPID_PRIVATE_KEY?.trim() &&
        process.env.VAPID_SUBJECT?.trim()
      ),
    }, { status: 500 });
  }

  const reusableDeviceRegistered = Boolean(data?.length);
  const linkedToThisOrder = Boolean(orderId && data?.some((row: any) => row.order_id === orderId));

  return NextResponse.json({
    ok: true,
    activeSubscriptions: count || 0,
    reusableDeviceRegistered,
    linkedToThisOrder,
    vapidConfigured: Boolean(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim()
    ),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const subscription = body.subscription as PushSubscriptionPayload | undefined;
  const orderId = body.orderId ? String(body.orderId) : null;
  const tenantId = body.tenantId ? String(body.tenantId) : null;
  const customerName = body.customerName ? String(body.customerName) : null;
  const customerPhone = body.customerPhone ? String(body.customerPhone) : null;

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "Invalid customer push subscription payload" }, { status: 400 });
  }

  const resolvedTenantId = await resolveTenantId(orderId, tenantId);
  if (!resolvedTenantId) {
    return NextResponse.json({ error: "Could not resolve tenant for customer push registration" }, { status: 400 });
  }

  const endpoint = subscription.endpoint;

  // First, reuse or create the device-level registration for this tenant+endpoint
  const devicePayload = {
    tenant_id: resolvedTenantId,
    order_id: orderId,
    customer_name: customerName,
    customer_phone: customerPhone,
    endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    user_agent: req.headers.get("user-agent") || null,
    device_label: "Storefront PWA",
    enabled: true,
    updated_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
  };

  const { error: upsertError } = await db
    .from("customer_push_subscriptions")
    .upsert(devicePayload, { onConflict: "tenant_id,endpoint" });

  if (upsertError) {
    return NextResponse.json(
      { error: `Failed to save customer push subscription: ${upsertError.message}` },
      { status: 500 }
    );
  }

  // Then, if a new order exists, ensure the current order is linked to the existing device registration
  if (orderId) {
    const { error: linkError } = await db
      .from("customer_push_subscriptions")
      .update({
        order_id: orderId,
        customer_name: customerName,
        customer_phone: customerPhone,
        enabled: true,
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      })
      .eq("tenant_id", resolvedTenantId)
      .eq("endpoint", endpoint);

    if (linkError) {
      return NextResponse.json(
        { error: `Saved device but failed to link current order: ${linkError.message}` },
        { status: 500 }
      );
    }
  }

  const { count } = await db
    .from("customer_push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", resolvedTenantId)
    .eq("enabled", true);

  return NextResponse.json({
    ok: true,
    message: orderId
      ? "This device is saved and linked to the current order for customer push updates."
      : "This device is saved for reusable customer push updates.",
    activeSubscriptions: count || 0,
    reusableDeviceRegistered: true,
    linkedToThisOrder: Boolean(orderId),
  });
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const endpoint = body.endpoint ? String(body.endpoint) : "";
  const orderId = body.orderId ? String(body.orderId) : null;
  const tenantId = body.tenantId ? String(body.tenantId) : null;

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  const resolvedTenantId = await resolveTenantId(orderId, tenantId);
  if (!resolvedTenantId) {
    return NextResponse.json({ error: "Could not resolve tenant for customer push removal" }, { status: 400 });
  }

  const { error } = await db
    .from("customer_push_subscriptions")
    .update({
      enabled: false,
      updated_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    })
    .eq("tenant_id", resolvedTenantId)
    .eq("endpoint", endpoint);

  if (error) {
    return NextResponse.json({ error: `Failed to disable customer push subscription: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
