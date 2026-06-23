import { NextResponse } from "next/server";
import { reconcileOzowIntent } from "@/lib/storefront-ozow";

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
    const transactionReference = first(url.searchParams.get("TransactionReference") || url.searchParams.get("transactionReference"));
    const transactionId = first(url.searchParams.get("TransactionId") || url.searchParams.get("transactionId"));

    if (!checkoutId && !transactionReference && !transactionId) {
      return NextResponse.json({ error: "Missing Ozow checkout reference." }, { status: 400 });
    }

    const result = await reconcileOzowIntent({ checkoutId, transactionReference, transactionId });
    if (!result) return NextResponse.json({ error: "Ozow checkout was not found." }, { status: 404 });

    const tenantSlug = readPayloadTenantSlug(result.intent?.order_payload);
    return NextResponse.json({
      ok: true,
      checkoutId: result.intent?.id || checkoutId || null,
      transactionReference: result.transactionReference || transactionReference || null,
      transactionId: result.transactionId || transactionId || null,
      status: result.status,
      paid: result.status === "paid",
      orderId: result.orderId || result.intent?.order_id || null,
      tenantSlug,
      storeUrl: buildStoreUrl(tenantSlug, "/"),
      checkoutUrl: buildStoreUrl(tenantSlug, "/checkout"),
    });
  } catch (error) {
    console.error("Storefront Ozow checkout status failed", error);
    const message = error instanceof Error ? error.message : "Could not check Ozow payment status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
