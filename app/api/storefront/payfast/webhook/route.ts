import { NextResponse } from "next/server";
import { normalizePayFastResponse, processPayFastResponse } from "@/lib/storefront-payfast";

export const runtime = "nodejs";

async function readFormOrJson(req: Request) {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const formData = await req.formData();
  return Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value : ""]));
}

export async function POST(req: Request) {
  try {
    const body = await readFormOrJson(req);
    const payload = normalizePayFastResponse(body);
    const result = await processPayFastResponse(payload);
    return NextResponse.json({ received: true, ...result, intent: undefined });
  } catch (error) {
    console.error("Tenant storefront PayFast webhook failed", error);
    const message = error instanceof Error ? error.message : "Storefront PayFast webhook failed.";
    return NextResponse.json({ received: false, error: message }, { status: 400 });
  }
}
