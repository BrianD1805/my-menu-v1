import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function first(value: string | null) {
  return value?.trim() || "";
}

function readPayloadTenantSlug(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  return typeof record.tenantSlug === "string" ? record.tenantSlug.trim() : "";
}

function buildStoreUrl(tenantSlug: string, path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!tenantSlug) return cleanPath;
  return `https://${tenantSlug}.orduva.com${cleanPath}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const sessionId = first(url.searchParams.get("session_id"));
    const checkoutId = first(url.searchParams.get("checkout_id"));

    if (!sessionId && !checkoutId) {
      return NextResponse.json({ error: "Missing Stripe checkout reference." }, { status: 400 });
    }

    let intentQuery = db
      .from("storefront_payment_intents")
      .select("id,status,order_id,tenant_id,stripe_checkout_session_id,stripe_payment_intent_id,order_payload,updated_at");

    if (sessionId) intentQuery = intentQuery.eq("stripe_checkout_session_id", sessionId);
    else intentQuery = intentQuery.eq("id", checkoutId);

    const { data: intent, error: intentError } = await intentQuery.maybeSingle();
    if (intentError) throw intentError;

    let order: Record<string, any> | null = null;
    if (intent?.order_id) {
      const { data: orderData, error: orderError } = await db
        .from("orders")
        .select("id,total,payment_status,payment_method_label,created_at")
        .eq("id", intent.order_id)
        .maybeSingle();
      if (orderError) throw orderError;
      order = orderData || null;
    } else if (sessionId) {
      const { data: orderData, error: orderError } = await db
        .from("orders")
        .select("id,total,payment_status,payment_method_label,created_at")
        .eq("payment_checkout_session_id", sessionId)
        .maybeSingle();
      if (orderError) throw orderError;
      order = orderData || null;
    }

    const tenantSlug = readPayloadTenantSlug(intent?.order_payload);
    const paid = order?.payment_status === "paid" || intent?.status === "paid";

    return NextResponse.json({
      ok: true,
      paid,
      intentStatus: intent?.status || null,
      checkoutId: intent?.id || checkoutId || null,
      sessionId: intent?.stripe_checkout_session_id || sessionId || null,
      tenantSlug,
      storeUrl: buildStoreUrl(tenantSlug, "/"),
      checkoutUrl: buildStoreUrl(tenantSlug, "/checkout"),
      order: order
        ? {
            id: order.id,
            shortId: String(order.id || "").slice(0, 8),
            total: order.total,
            paymentStatus: order.payment_status,
            paymentMethodLabel: order.payment_method_label,
            createdAt: order.created_at,
          }
        : null,
    });
  } catch (error) {
    console.error("Storefront Stripe checkout status failed", error);
    const message = error instanceof Error ? error.message : "Could not check payment status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
