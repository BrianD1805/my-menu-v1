import { NextResponse } from "next/server";
import { sendCustomerPushForOrder } from "@/lib/web-push";

export async function POST(req: Request) {
  const body = (await req.json()) as { orderId?: string };
  const orderId = String(body.orderId || "").trim();

  if (!orderId) {
    return NextResponse.json({ error: "Missing order ID." }, { status: 400 });
  }

  const result = await sendCustomerPushForOrder(orderId, {
    title: "Order update test",
    body: "Customer push test sent to this order subscription.",
    url: "/",
    tag: `orduva-customer-test-${orderId}`,
  });

  if (!result.ok) {
    const message =
      result.reason === "missing_vapid"
        ? "VAPID keys are not configured yet."
        : result.reason === "no_subscriptions"
          ? "No active customer push subscriptions found for this order."
          : "Customer push could not be delivered.";

    return NextResponse.json({ error: message, ...result }, { status: 400 });
  }

  return NextResponse.json({ message: `Customer push sent to ${result.sent} device(s).`, ...result });
}
