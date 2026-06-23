import { NextResponse } from "next/server";
import { buildOzowAutoSubmitHtml, buildOzowPostFields, loadOzowIntentByReference, loadTenantOzowCustomerSettings } from "@/lib/storefront-ozow";

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
    if (!checkoutId) return NextResponse.json({ error: "Missing Ozow checkout reference." }, { status: 400 });

    const intent = await loadOzowIntentByReference({ checkoutId });
    if (!intent) return NextResponse.json({ error: "Ozow checkout was not found." }, { status: 404 });

    const settings = await loadTenantOzowCustomerSettings(String(intent.tenant_id));
    if (!settings?.ozow_site_code || !settings?.ozow_private_key) return NextResponse.json({ error: "Ozow is not configured for this store." }, { status: 400 });

    const payload = intent.order_payload as Record<string, unknown> | null;
    const tenantSlug = readTenantSlug(payload);
    const amount = Math.max(0, Math.round(Number(intent.amount_total || 0) * 100) / 100).toFixed(2);
    const origin = originFromRequest(req);
    const transactionReference = String(intent.ozow_transaction_reference || intent.id);
    const bankReference = `ORD${String(intent.id).replace(/-/g, "").slice(0, 17)}`.slice(0, 20);
    const fields = buildOzowPostFields({
      settings,
      amount,
      transactionReference,
      bankReference,
      customer: String(intent.customer_name || "Customer"),
      successUrl: `${origin}/api/storefront/ozow/return?result=success&checkout_id=${encodeURIComponent(String(intent.id))}`,
      cancelUrl: `${origin}/api/storefront/ozow/return?result=cancel&checkout_id=${encodeURIComponent(String(intent.id))}`,
      errorUrl: `${origin}/api/storefront/ozow/return?result=error&checkout_id=${encodeURIComponent(String(intent.id))}`,
      notifyUrl: `${origin}/api/storefront/ozow/webhook`,
      tenantSlug,
      checkoutId: String(intent.id),
    });

    return new NextResponse(buildOzowAutoSubmitHtml(fields), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Ozow payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
