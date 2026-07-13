import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  CUSTOM_DOMAIN_ADDON_USD_MONTHLY,
  customDomainAddonPrice,
} from "@/lib/custom-domain-addon";
import { createCustomDomainStripeCheckoutSession } from "@/lib/custom-domain-stripe";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

function cleanId(value: unknown) {
  return String(value || "").trim().slice(0, 120);
}

async function loadAddonPrice() {
  const { data } = await db
    .from("platform_custom_domain_addon_settings")
    .select("monthly_price_usd, stripe_price_id")
    .eq("id", "default")
    .maybeSingle();
  return customDomainAddonPrice(
    data?.monthly_price_usd ?? CUSTOM_DOMAIN_ADDON_USD_MONTHLY,
    data?.stripe_price_id || null,
  );
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const domainId = cleanId(body?.domainId);
    if (!domainId) {
      return jsonNoStore({ error: "Custom domain request id is required." }, { status: 400 });
    }

    const { data: domain, error } = await db
      .from("tenant_custom_domains")
      .select("id, tenant_id, domain_name, normalized_domain, status, billing_status, addon_price_monthly, stripe_price_id")
      .eq("id", domainId)
      .eq("tenant_id", auth.tenant.id)
      .maybeSingle();

    if (error || !domain) {
      return jsonNoStore({ error: "Custom domain request was not found for this store." }, { status: 404 });
    }

    if (domain.status === "active" || domain.billing_status === "active" || domain.billing_status === "manual") {
      return jsonNoStore({ error: "This custom domain add-on is already marked as active." }, { status: 400 });
    }

    const price = await loadAddonPrice();
    const session = await createCustomDomainStripeCheckoutSession(req, {
      tenantId: auth.tenant.id,
      tenantSlug: auth.tenant.slug,
      tenantName: auth.tenant.name || auth.tenant.slug,
      ownerEmail: auth.user.email,
      customDomainId: domain.id,
      domainName: domain.domain_name,
      monthlyUsd: price.amount,
      priceId: price.stripePriceId || domain.stripe_price_id || null,
    });

    await db
      .from("tenant_custom_domains")
      .update({
        status: "billing_pending",
        billing_status: "addon_pending",
        addon_price_currency: "USD",
        addon_price_monthly: session.amount,
        stripe_price_id: session.priceId,
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", domain.id)
      .eq("tenant_id", auth.tenant.id);

    return jsonNoStore({
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      domainId: domain.id,
      price: customDomainAddonPrice(session.amount, session.priceId),
    });
  } catch (error) {
    return jsonNoStore(
      { error: error instanceof Error ? error.message : "Could not start custom-domain Stripe checkout." },
      { status: 400 },
    );
  }
}
