import { NextResponse } from "next/server";
import { reconcilePesapalIntent } from "@/lib/storefront-pesapal";

function first(value: string | null) {
  return String(value || "").split(",")[0].trim();
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
    const checkoutId = first(url.searchParams.get("checkout_id"));
    const orderTrackingId = first(url.searchParams.get("OrderTrackingId") || url.searchParams.get("orderTrackingId") || url.searchParams.get("pesapal_transaction_tracking_id"));
    const merchantReference = first(url.searchParams.get("OrderMerchantReference") || url.searchParams.get("merchantReference") || url.searchParams.get("pesapal_merchant_reference"));

    if (!checkoutId && !orderTrackingId && !merchantReference) {
      return NextResponse.json({ error: "Missing M-Pesa/Pesapal checkout reference." }, { status: 400 });
    }

    const result = await reconcilePesapalIntent({ checkoutId, orderTrackingId, merchantReference });
    if (!result) return NextResponse.json({ error: "M-Pesa checkout was not found." }, { status: 404 });

    const tenantSlug = readPayloadTenantSlug(result.intent?.order_payload);

    return NextResponse.json({
      ok: true,
      checkoutId: result.intent?.id || checkoutId || null,
      orderTrackingId: result.intent?.pesapal_order_tracking_id || orderTrackingId || null,
      merchantReference: result.intent?.pesapal_merchant_reference || merchantReference || null,
      status: result.status,
      paid: result.status === "paid",
      orderId: result.orderId || result.intent?.order_id || null,
      paymentId: result.paymentId || null,
      paymentMethod: result.paymentMethod || null,
      tenantSlug,
      storeUrl: buildStoreUrl(tenantSlug, "/"),
      checkoutUrl: buildStoreUrl(tenantSlug, "/checkout"),
    });
  } catch (error) {
    console.error("Storefront M-Pesa checkout status failed", error);
    const message = error instanceof Error ? error.message : "Could not check M-Pesa payment status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
