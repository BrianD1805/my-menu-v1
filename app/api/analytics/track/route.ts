import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inferAnalyticsScope, normaliseAnalyticsEventType, normaliseAnalyticsScope, resolveAnalyticsTenantId, safeAnalyticsText } from "@/lib/analytics";

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const host = safeAnalyticsText(req.headers.get("x-forwarded-host") || req.headers.get("host"), 180) || "unknown";
    const pagePath = safeAnalyticsText(body?.pagePath, 500) || "/";
    const inferredScope = inferAnalyticsScope(host, pagePath);
    const explicitScope = normaliseAnalyticsScope(body?.scope);
    const scope = explicitScope === "unknown" ? inferredScope : explicitScope;
    const eventType = normaliseAnalyticsEventType(body?.eventType);
    const tenantId = await resolveAnalyticsTenantId(host, body?.tenantSlug, body?.tenantId);

    // Lightweight guardrail: only record useful events, not noisy UI activity.
    const allowedEventTypes = new Set([
      "page_view",
      "storefront_visit",
      "product_view",
      "product_share",
      "add_to_cart",
      "checkout_started",
      "order_created",
      "order_placed",
      "referral_link_click",
      "affiliate_apply_click",
    ]);
    if (!allowedEventTypes.has(eventType)) return NextResponse.json({ ok: true, skipped: true });

    const { error } = await db.from("analytics_events").insert({
      tenant_id: tenantId,
      scope,
      event_type: eventType,
      host,
      page_path: pagePath,
      page_url: safeAnalyticsText(body?.pageUrl, 1200),
      referrer: safeAnalyticsText(body?.referrer, 1200),
      product_id: safeAnalyticsText(body?.productId, 120),
      product_name: safeAnalyticsText(body?.productName, 240),
      order_id: safeAnalyticsText(body?.orderId, 120),
      referral_code: safeAnalyticsText(body?.referralCode, 160),
      affiliate_code: safeAnalyticsText(body?.affiliateCode, 160),
      anonymous_session_id: safeAnalyticsText(body?.anonymousSessionId, 160),
      device_type: safeAnalyticsText(body?.deviceType, 40),
      browser_language: safeAnalyticsText(body?.language, 80),
      user_agent: safeAnalyticsText(req.headers.get("user-agent"), 500),
      ip_address: clientIp(req),
      metadata: safeMetadata(body?.metadata),
    });

    if (error) return NextResponse.json({ ok: false, error: "Analytics event was not recorded." }, { status: 200 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true, skipped: true });
  }
}
