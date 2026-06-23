import { NextResponse } from "next/server";
import { buildPayFastAutoSubmitHtml, buildPayFastPostFields, loadPayFastIntentByReference, loadTenantPayFastCustomerSettings } from "@/lib/storefront-payfast";

export const runtime = "nodejs";

function first(value: string | null) {
  return String(value || "").split(",")[0].trim();
}

function originFromRequest(req: Request) {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

function readTenantSlug(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  return typeof record.tenantSlug === "string" ? record.tenantSlug.trim() : "";
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const checkoutId = first(url.searchParams.get("checkout_id"));
    if (!checkoutId) return NextResponse.json({ error: "Missing PayFast checkout reference." }, { status: 400 });

    const intent = await loadPayFastIntentByReference({ checkoutId });
    if (!intent) return NextResponse.json({ error: "PayFast checkout was not found." }, { status: 404 });

    const settings = await loadTenantPayFastCustomerSettings(String(intent.tenant_id));
    if (!settings?.payfast_merchant_id || !settings?.payfast_merchant_key) return NextResponse.json({ error: "PayFast is not configured for this store." }, { status: 400 });

    const payload = intent.order_payload as Record<string, unknown> | null;
    const tenantSlug = readTenantSlug(payload);
    const amount = Math.max(0, Math.round(Number(intent.amount_total || 0) * 100) / 100).toFixed(2);
    const origin = originFromRequest(req);
    const transactionReference = String(intent.payfast_transaction_reference || intent.id);
    const bankReference = `ORD${String(intent.id).replace(/-/g, "").slice(0, 17)}`.slice(0, 20);
    const fields = buildPayFastPostFields({
      settings,
      amount,
      transactionReference,
      bankReference,
      customer: String(intent.customer_name || "Customer"),
      successUrl: `${origin}/api/storefront/payfast/return?result=success&checkout_id=${encodeURIComponent(String(intent.id))}`,
      cancelUrl: `${origin}/api/storefront/payfast/return?result=cancel&checkout_id=${encodeURIComponent(String(intent.id))}`,
      errorUrl: `${origin}/api/storefront/payfast/return?result=error&checkout_id=${encodeURIComponent(String(intent.id))}`,
      notifyUrl: `${origin}/api/storefront/payfast/webhook`,
      tenantSlug,
      checkoutId: String(intent.id),
    });

    return new NextResponse(buildPayFastAutoSubmitHtml(fields), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start PayFast payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
