import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendCustomerPushForOrderWithFallback } from "@/lib/web-push";

export async function POST(req: Request) {
  const body = (await req.json()) as { orderId?: string };
  const orderId = String(body.orderId || "").trim();

  if (!orderId) {
    return NextResponse.json({ error: "Missing order ID." }, { status: 400 });
  }

  const orderLookup = await db
    .from("orders")
    .select("tenant_id")
    .eq("id", orderId)
    .maybeSingle();

  const tenantId = orderLookup.data?.tenant_id;
  if (!tenantId) {
    return NextResponse.json({ error: "Could not resolve tenant for this order." }, { status: 400 });
  }

  const result = await sendCustomerPushForOrderWithFallback(tenantId, orderId, {
    title: "Order update test",
    body: "Customer push test sent to this saved customer device.",
    url: "/",
    tag: `orduva-customer-test-${orderId}`,
  });

  if (!result.ok) {
    const message =
      result.reason === "missing_vapid"
        ? "VAPID keys are not configured yet."
        : result.reason === "no_subscriptions"
          ? "No active customer push subscriptions found for this customer."
          : "Customer push could not be delivered.";

    return NextResponse.json({ error: message, ...result }, { status: 400 });
  }

  return NextResponse.json({ message: `Customer push sent to ${result.sent} device(s).`, ...result });
}
