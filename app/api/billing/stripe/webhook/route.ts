import { NextResponse } from "next/server";
import { processStripeWebhook, verifyAndParseStripeWebhook } from "@/lib/stripe-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  try {
    const event = verifyAndParseStripeWebhook(rawBody, signature);
    const result = await processStripeWebhook(event);
    return jsonNoStore(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook failed.";
    const isVerificationError = message.toLowerCase().includes("signature") || message.toLowerCase().includes("secret");
    return jsonNoStore({ ok: false, error: message }, { status: isVerificationError ? 400 : 500 });
  }
}
