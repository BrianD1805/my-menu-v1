import { NextResponse } from "next/server";
import { reconcileDarajaIntent } from "@/lib/storefront-daraja";

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
    const checkoutRequestId = first(url.searchParams.get("CheckoutRequestID") || url.searchParams.get("checkout_request_id"));
    const merchantRequestId = first(url.searchParams.get("MerchantRequestID") || url.searchParams.get("merchant_request_id"));

    if (!checkoutId && !checkoutRequestId && !merchantRequestId) {
      return NextResponse.json({ error: "Missing direct M-Pesa checkout reference." }, { status: 400 });
    }

    const result = await reconcileDarajaIntent({ checkoutId, checkoutRequestId, merchantRequestId });
    const intent = result?.intent;
    if (!intent) return NextResponse.json({ error: "Direct M-Pesa checkout was not found." }, { status: 404 });

    const tenantSlug = readPayloadTenantSlug(intent.order_payload);
    const paid = result?.status === "paid" || intent.status === "paid" || Boolean(result?.orderId || intent.order_id);
    const waitingMessage = intent.daraja_result_code === "0" && intent.daraja_mpesa_receipt_number
      ? "Safaricom has confirmed your M-Pesa payment. Your order is being finalised."
      : intent.status === "checkout_started"
        ? "STK Push sent. Waiting for Safaricom to confirm the payment."
        : null;

    return NextResponse.json({
      ok: true,
      checkoutId: intent.id || checkoutId || null,
      merchantRequestId: intent.daraja_merchant_request_id || merchantRequestId || null,
      checkoutRequestId: intent.daraja_checkout_request_id || checkoutRequestId || null,
      accountReference: intent.daraja_account_reference || null,
      phoneNumber: intent.daraja_phone_number || null,
      resultCode: intent.daraja_result_code || null,
      resultDescription: intent.daraja_result_description || null,
      mpesaReceiptNumber: intent.daraja_mpesa_receipt_number || result?.mpesaReceiptNumber || null,
      status: result?.status || intent.status || "checkout_started",
      paid,
      orderId: result?.orderId || intent.order_id || null,
      tenantSlug,
      storeUrl: buildStoreUrl(tenantSlug, "/"),
      checkoutUrl: buildStoreUrl(tenantSlug, "/checkout"),
      message: paid ? "Payment confirmed. Your order has been sent to the store." : waitingMessage,
    });
  } catch (error) {
    console.error("Storefront Daraja checkout status failed", error);
    const message = error instanceof Error ? error.message : "Could not check direct M-Pesa payment status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
