import { NextResponse } from "next/server";
import { reconcileYocoIntent } from "@/lib/storefront-yoco";

function first(value: string | null) {
  return String(value || "").split(",")[0].trim();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const checkoutId = first(url.searchParams.get("checkout_id"));
    const yocoCheckoutId = first(url.searchParams.get("yoco_checkout_id"));

    if (!checkoutId && !yocoCheckoutId) {
      return NextResponse.json({ error: "Missing Yoco checkout reference." }, { status: 400 });
    }

    const result = await reconcileYocoIntent({ checkoutId, yocoCheckoutId });
    if (!result) return NextResponse.json({ error: "Yoco checkout was not found." }, { status: 404 });

    return NextResponse.json({
      ok: true,
      checkoutId: result.intent?.id || checkoutId || null,
      yocoCheckoutId: result.intent?.yoco_checkout_id || yocoCheckoutId || null,
      status: result.status,
      paid: result.status === "paid",
      orderId: result.orderId || result.intent?.order_id || null,
      paymentId: result.paymentId || null,
      checkoutUrl: "/checkout",
    });
  } catch (error) {
    console.error("Storefront Yoco checkout status failed", error);
    const message = error instanceof Error ? error.message : "Could not check Yoco payment status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
