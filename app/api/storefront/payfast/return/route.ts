import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadPayFastIntentByReference, normalizePayFastResponse, processPayFastResponse } from "@/lib/storefront-payfast";

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
  const response = normalizePayFastResponse(raw);
  const checkoutId = String(raw.checkout_id || response.custom_str1 || response.m_payment_id || "").trim();
  let resultStatus = String(url.searchParams.get("result") || raw.result || "").toLowerCase();
  let intent = checkoutId ? await loadPayFastIntentByReference({ checkoutId, transactionReference: response.m_payment_id, transactionId: response.pf_payment_id }) : null;

  if (response.signature && response.payment_status) {
    const processed = await processPayFastResponse(response);
    intent = processed.intent as Record<string, any>;
    resultStatus = processed.status === "paid" ? "success" : processed.status;
  } else if (intent && (resultStatus === "cancel" || resultStatus === "cancelled" || resultStatus === "error")) {
    await db.from("storefront_payment_intents").update({ status: resultStatus.startsWith("cancel") ? "cancelled" : "failed", updated_at: new Date().toISOString() }).eq("id", intent.id).eq("provider", "payfast").is("order_id", null);
  }

  const tenantSlug = readTenantSlug(intent?.order_payload);
  const finalCheckoutId = String(intent?.id || checkoutId || "");
  const path = resultStatus === "success" || resultStatus === "paid" ? "/checkout/payment/payfast/success" : resultStatus.startsWith("cancel") ? "/checkout/payment/payfast/cancel" : "/checkout/payment/payfast/error";
  return NextResponse.redirect(buildReturnUrl(req, tenantSlug, path, finalCheckoutId));
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
