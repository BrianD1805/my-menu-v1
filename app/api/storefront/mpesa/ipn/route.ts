import { NextResponse } from "next/server";
import { reconcilePesapalIntent } from "@/lib/storefront-pesapal";

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

async function readIpnPayload(req: Request) {
  const url = new URL(req.url);
  const query = {
    orderTrackingId: getString(url.searchParams.get("OrderTrackingId") || url.searchParams.get("orderTrackingId") || url.searchParams.get("pesapal_transaction_tracking_id")),
    merchantReference: getString(url.searchParams.get("OrderMerchantReference") || url.searchParams.get("merchantReference") || url.searchParams.get("pesapal_merchant_reference")),
    notificationType: getString(url.searchParams.get("OrderNotificationType") || url.searchParams.get("notificationType")),
  };

  if (req.method === "GET") return query;

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    return {
      orderTrackingId: getString(body.OrderTrackingId || body.orderTrackingId || body.pesapal_transaction_tracking_id) || query.orderTrackingId,
      merchantReference: getString(body.OrderMerchantReference || body.merchantReference || body.pesapal_merchant_reference) || query.merchantReference,
      notificationType: getString(body.OrderNotificationType || body.notificationType) || query.notificationType,
    };
  }

  const text = await req.text().catch(() => "");
  const params = new URLSearchParams(text);
  return {
    orderTrackingId: getString(params.get("OrderTrackingId") || params.get("orderTrackingId") || params.get("pesapal_transaction_tracking_id")) || query.orderTrackingId,
    merchantReference: getString(params.get("OrderMerchantReference") || params.get("merchantReference") || params.get("pesapal_merchant_reference")) || query.merchantReference,
    notificationType: getString(params.get("OrderNotificationType") || params.get("notificationType")) || query.notificationType,
  };
}

async function handleIpn(req: Request) {
  try {
    const payload = await readIpnPayload(req);
    if (!payload.orderTrackingId && !payload.merchantReference) {
      return NextResponse.json({ ok: false, error: "Missing Pesapal IPN reference." }, { status: 400 });
    }

    const result = await reconcilePesapalIntent({ orderTrackingId: payload.orderTrackingId, merchantReference: payload.merchantReference });
    return NextResponse.json({
      ok: true,
      message: result?.status === "paid" ? "M-Pesa/Pesapal payment confirmed." : "M-Pesa/Pesapal notification checked.",
      status: result?.status || "not_found",
      orderId: result?.orderId || null,
    });
  } catch (error) {
    console.error("M-Pesa/Pesapal IPN failed", error);
    const message = error instanceof Error ? error.message : "Could not process M-Pesa/Pesapal IPN.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleIpn(req);
}

export async function POST(req: Request) {
  return handleIpn(req);
}
