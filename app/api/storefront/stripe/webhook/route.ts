import { NextResponse } from "next/server";
import { processTenantStripeWebhook, verifyAndParseTenantStripeWebhook } from "@/lib/storefront-stripe";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");
    const event = await verifyAndParseTenantStripeWebhook(rawBody, signature);
    const message = await processTenantStripeWebhook(event);
    return NextResponse.json({ received: true, message });
  } catch (error) {
    console.error("Tenant storefront Stripe webhook failed", error);
    const message = error instanceof Error ? error.message : "Storefront Stripe webhook failed.";
    return NextResponse.json({ received: false, error: message }, { status: 400 });
  }
}
