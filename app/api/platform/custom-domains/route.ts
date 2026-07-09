import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/platform-security";
import { db } from "@/lib/db";
import { CUSTOM_DOMAIN_ADDON_USD_MONTHLY, CUSTOM_DOMAIN_DNS_TARGET, customDomainAddonPrice } from "@/lib/custom-domain-addon";

const ALLOWED_STATUS = new Set(["requested", "billing_pending", "pending_dns", "pending_owner_review", "approved", "active", "rejected", "disabled"]);
const ALLOWED_BILLING_STATUS = new Set(["not_started", "addon_pending", "active", "past_due", "cancelled", "manual"]);

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

function cleanText(value: unknown, max = 1000) {
  const text = String(value || "").trim();
  return text ? text.slice(0, max) : null;
}

async function loadAddonSettings() {
  const { data, error } = await db
    .from("platform_custom_domain_addon_settings")
    .select("monthly_price_usd, stripe_price_id, updated_at")
    .eq("id", "default")
    .maybeSingle();

  if (error) return { ...customDomainAddonPrice(CUSTOM_DOMAIN_ADDON_USD_MONTHLY), updatedAt: null };
  return {
    ...customDomainAddonPrice(data?.monthly_price_usd ?? CUSTOM_DOMAIN_ADDON_USD_MONTHLY, data?.stripe_price_id || null),
    updatedAt: data?.updated_at || null,
  };
}

async function loadDomains() {
  const { data, error } = await db
    .from("tenant_custom_domains")
    .select("id, tenant_id, domain_name, normalized_domain, status, billing_status, addon_price_currency, addon_price_monthly, billing_interval, requested_by_email, tenant_notes, owner_notes, dns_target, verification_token, stripe_price_id, stripe_subscription_item_id, stripe_checkout_session_id, netlify_site_id, netlify_domain_alias_id, approved_at, activated_at, created_at, updated_at, tenants(name, slug)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data || [];
}

export async function GET(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    return jsonNoStore({ ok: true, dnsTarget: CUSTOM_DOMAIN_DNS_TARGET, addonSettings: await loadAddonSettings(), domains: await loadDomains() });
  } catch {
    return jsonNoStore({ error: "Failed to load custom domain requests." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    const body = await req.json().catch(() => ({}));

    if (body?.kind === "settings") {
      const amount = Number(body?.monthlyPriceUsd);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 999) {
        return jsonNoStore({ error: "Enter a valid USD monthly price." }, { status: 400 });
      }
      const stripePriceId = cleanText(body?.stripePriceId, 160);
      const { data, error } = await db
        .from("platform_custom_domain_addon_settings")
        .upsert(
          {
            id: "default",
            currency: "USD",
            monthly_price_usd: Number(amount.toFixed(2)),
            stripe_price_id: stripePriceId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select("monthly_price_usd, stripe_price_id, updated_at")
        .single();

      if (error || !data) return jsonNoStore({ error: "Failed to save custom domain add-on settings." }, { status: 500 });
      return jsonNoStore({ ok: true, addonSettings: await loadAddonSettings() });
    }

    const id = cleanText(body?.id, 80);
    if (!id) return jsonNoStore({ error: "Custom domain request id is required." }, { status: 400 });

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const nextStatus = String(body?.status || "").trim().toLowerCase();
    if (nextStatus) {
      if (!ALLOWED_STATUS.has(nextStatus)) return jsonNoStore({ error: "Unsupported custom domain status." }, { status: 400 });
      payload.status = nextStatus;
      if (nextStatus === "approved") payload.approved_at = new Date().toISOString();
      if (nextStatus === "active") {
        payload.approved_at = new Date().toISOString();
        payload.activated_at = new Date().toISOString();
      }
      if (nextStatus === "disabled") payload.disabled_at = new Date().toISOString();
    }

    const nextBillingStatus = String(body?.billingStatus || "").trim().toLowerCase();
    if (nextBillingStatus) {
      if (!ALLOWED_BILLING_STATUS.has(nextBillingStatus)) return jsonNoStore({ error: "Unsupported add-on billing status." }, { status: 400 });
      payload.billing_status = nextBillingStatus;
    }

    if (Object.prototype.hasOwnProperty.call(body, "ownerNotes")) payload.owner_notes = cleanText(body?.ownerNotes, 1000);
    if (Object.prototype.hasOwnProperty.call(body, "dnsTarget")) payload.dns_target = cleanText(body?.dnsTarget, 240) || CUSTOM_DOMAIN_DNS_TARGET;
    if (Object.prototype.hasOwnProperty.call(body, "stripeSubscriptionItemId")) payload.stripe_subscription_item_id = cleanText(body?.stripeSubscriptionItemId, 160);
    if (Object.prototype.hasOwnProperty.call(body, "stripeCheckoutSessionId")) payload.stripe_checkout_session_id = cleanText(body?.stripeCheckoutSessionId, 160);
    if (Object.prototype.hasOwnProperty.call(body, "netlifySiteId")) payload.netlify_site_id = cleanText(body?.netlifySiteId, 160);
    if (Object.prototype.hasOwnProperty.call(body, "netlifyDomainAliasId")) payload.netlify_domain_alias_id = cleanText(body?.netlifyDomainAliasId, 160);
    if (Object.prototype.hasOwnProperty.call(body, "stripePriceId")) payload.stripe_price_id = cleanText(body?.stripePriceId, 160);

    const { data, error } = await db
      .from("tenant_custom_domains")
      .update(payload)
      .eq("id", id)
      .select("id, tenant_id, domain_name, normalized_domain, status, billing_status, addon_price_currency, addon_price_monthly, billing_interval, requested_by_email, tenant_notes, owner_notes, dns_target, verification_token, stripe_price_id, stripe_subscription_item_id, stripe_checkout_session_id, netlify_site_id, netlify_domain_alias_id, approved_at, activated_at, created_at, updated_at, tenants(name, slug)")
      .single();

    if (error || !data) return jsonNoStore({ error: "Failed to update custom domain request." }, { status: 500 });
    return jsonNoStore({ ok: true, domain: data });
  } catch (error) {
    return jsonNoStore({ error: error instanceof Error ? error.message : "Failed to update custom domain request." }, { status: 500 });
  }
}
