import { NextResponse } from "next/server";
import { processTenantYocoWebhook, verifyAndParseTenantYocoWebhook } from "@/lib/storefront-yoco";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const verified = await verifyAndParseTenantYocoWebhook(rawBody, req.headers);
    const message = await processTenantYocoWebhook(verified);
    return NextResponse.json({ received: true, message });
  } catch (error) {
    console.error("Tenant storefront Yoco webhook failed", error);
    const message = error instanceof Error ? error.message : "Storefront Yoco webhook failed.";
    return NextResponse.json({ received: false, error: message }, { status: 400 });
  }
}
