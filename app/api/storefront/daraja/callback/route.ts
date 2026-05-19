import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function getBodyObject(value: unknown) {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, any>;
}

function extractCallback(body: Record<string, any>) {
  return getBodyObject(body?.Body)?.stkCallback || body?.stkCallback || body;
}

function metadataValue(items: unknown, name: string) {
  if (!Array.isArray(items)) return "";
  const found = items.find((item) => String(item?.Name || "").toLowerCase() === name.toLowerCase());
  return found?.Value == null ? "" : String(found.Value);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, any> | null;
    if (!body) return NextResponse.json({ ok: false, error: "Missing Daraja callback payload." }, { status: 400 });

    const callback = extractCallback(body);
    const checkoutRequestId = String(callback?.CheckoutRequestID || "").trim();
    const merchantRequestId = String(callback?.MerchantRequestID || "").trim();
    const resultCode = callback?.ResultCode == null ? "" : String(callback.ResultCode);
    const resultDescription = String(callback?.ResultDesc || "").trim();
    const metadataItems = callback?.CallbackMetadata?.Item;
    const receiptNumber = metadataValue(metadataItems, "MpesaReceiptNumber");
    const phoneNumber = metadataValue(metadataItems, "PhoneNumber");

    if (!checkoutRequestId && !merchantRequestId) {
      return NextResponse.json({ ok: false, error: "Daraja callback missing CheckoutRequestID." }, { status: 400 });
    }

    let query = db.from("storefront_payment_intents").update({
      daraja_result_code: resultCode || null,
      daraja_result_description: resultDescription || null,
      daraja_mpesa_receipt_number: receiptNumber || null,
      daraja_callback_payload: body,
      ...(phoneNumber ? { daraja_phone_number: phoneNumber } : {}),
      ...(resultCode && resultCode !== "0" ? { status: "failed" } : {}),
      updated_at: new Date().toISOString(),
    });

    query = checkoutRequestId ? query.eq("daraja_checkout_request_id", checkoutRequestId) : query.eq("daraja_merchant_request_id", merchantRequestId);
    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Daraja callback intake failed", error);
    const message = error instanceof Error ? error.message : "Daraja callback could not be recorded.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
