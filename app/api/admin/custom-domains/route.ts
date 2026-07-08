import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  CUSTOM_DOMAIN_DNS_TARGET,
  customDomainAddonPrice,
  customDomainVerificationToken,
  isValidCustomDomain,
  normaliseCustomDomain,
} from "@/lib/custom-domain-addon";
import { normalisePricingCurrencyCode } from "@/lib/pricing";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

function cleanNotes(value: unknown) {
  const text = String(value || "").trim();
  return text ? text.slice(0, 1000) : null;
}

export async function GET(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  const { data, error } = await db
    .from("tenant_custom_domains")
    .select("id, domain_name, normalized_domain, status, billing_status, addon_price_currency, addon_price_monthly, requested_by_email, tenant_notes, owner_notes, dns_target, verification_token, approved_at, activated_at, created_at, updated_at")
    .eq("tenant_id", auth.tenant.id)
    .order("created_at", { ascending: false });

  if (error) return jsonNoStore({ error: "Failed to load custom domain requests." }, { status: 500 });

  const currency = normalisePricingCurrencyCode(new URL(req.url).searchParams.get("currency") || "USD");
  return jsonNoStore({
    ok: true,
    price: customDomainAddonPrice(currency),
    dnsTarget: CUSTOM_DOMAIN_DNS_TARGET,
    domains: data || [],
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const domain = normaliseCustomDomain(body?.domainName);
    if (!isValidCustomDomain(domain)) {
      return jsonNoStore({ error: "Enter a valid external domain, for example zimza.store. Do not enter an Orduva subdomain." }, { status: 400 });
    }

    const currencyCode = normalisePricingCurrencyCode(body?.currencyCode || "USD");
    const price = customDomainAddonPrice(currencyCode);
    const notes = cleanNotes(body?.tenantNotes);
    const verificationToken = customDomainVerificationToken(auth.tenant.slug, domain);

    const { data, error } = await db
      .from("tenant_custom_domains")
      .insert({
        tenant_id: auth.tenant.id,
        domain_name: domain,
        normalized_domain: domain,
        status: "requested",
        billing_status: "addon_pending",
        addon_price_currency: price.currencyCode,
        addon_price_monthly: price.amount,
        billing_interval: "monthly",
        requested_by_email: auth.user.email || null,
        tenant_notes: notes,
        dns_target: CUSTOM_DOMAIN_DNS_TARGET,
        verification_token: verificationToken,
      })
      .select("id, domain_name, normalized_domain, status, billing_status, addon_price_currency, addon_price_monthly, requested_by_email, tenant_notes, owner_notes, dns_target, verification_token, created_at, updated_at")
      .single();

    if (error) {
      const message = String(error.message || "");
      if (message.toLowerCase().includes("duplicate") || message.toLowerCase().includes("unique")) {
        return jsonNoStore({ error: "This domain has already been requested or assigned in Orduva." }, { status: 409 });
      }
      return jsonNoStore({ error: "Failed to save custom domain request." }, { status: 500 });
    }

    return jsonNoStore({ ok: true, domain: data, price });
  } catch (error) {
    return jsonNoStore({ error: error instanceof Error ? error.message : "Failed to request custom domain." }, { status: 500 });
  }
}
