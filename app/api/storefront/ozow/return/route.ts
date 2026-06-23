import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadOzowIntentByReference, normalizeOzowResponse, processOzowResponse } from "@/lib/storefront-ozow";

export const runtime = "nodejs";

function readTenantSlug(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  return typeof record.tenantSlug === "string" ? record.tenantSlug.trim() : "";
}

function buildReturnUrl(req: Request, tenantSlug: string, path: string, checkoutId: string) {
  const url = new URL(req.url);
  const host = url.host.toLowerCase();
  const origin = host === "localhost:3000" || host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? `${url.protocol}//${url.host}`
    : tenantSlug
      ? `https://${tenantSlug}.orduva.com`
      : `${url.protocol}//${url.host}`;
  return `${origin}${path}?checkout_id=${encodeURIComponent(checkoutId)}`;
}

async function readPayload(req: Request) {
  if (req.method === "GET") return Object.fromEntries(new URL(req.url).searchParams.entries());
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const formData = await req.formData();
  return Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, typeof value === "string" ? value : ""]));
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const raw = await readPayload(req);
  const response = normalizeOzowResponse(raw);
  const checkoutId = String(raw.checkout_id || response.Optional1 || response.TransactionReference || "").trim();
  let resultStatus = String(url.searchParams.get("result") || raw.result || "").toLowerCase();
  let intent = checkoutId ? await loadOzowIntentByReference({ checkoutId, transactionReference: response.TransactionReference, transactionId: response.TransactionId }) : null;

  if (response.Hash && response.Status) {
    const processed = await processOzowResponse(response);
    intent = processed.intent as Record<string, any>;
    resultStatus = processed.status === "paid" ? "success" : processed.status;
  } else if (intent && (resultStatus === "cancel" || resultStatus === "cancelled" || resultStatus === "error")) {
    await db.from("storefront_payment_intents").update({ status: resultStatus.startsWith("cancel") ? "cancelled" : "failed", updated_at: new Date().toISOString() }).eq("id", intent.id).eq("provider", "ozow").is("order_id", null);
  }

  const tenantSlug = readTenantSlug(intent?.order_payload);
  const finalCheckoutId = String(intent?.id || checkoutId || "");
  const path = resultStatus === "success" || resultStatus === "paid" ? "/checkout/payment/ozow/success" : resultStatus.startsWith("cancel") ? "/checkout/payment/ozow/cancel" : "/checkout/payment/ozow/error";
  return NextResponse.redirect(buildReturnUrl(req, tenantSlug, path, finalCheckoutId));
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
