import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  billingIntervalFromTenantPlanName,
  createStripeCheckoutSession,
  normaliseBillingInterval,
  planCodeFromTenantPlanName,
} from "@/lib/stripe-checkout";
import {
  BillingInterval,
  PricingCurrencyCode,
  PricingPlanCode,
  normalisePricingCurrencyCode,
  normalisePricingPlanCode,
} from "@/lib/pricing";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const tenant = auth.tenant;
    const user = auth.user;

    const { data: settings } = await db
      .from("tenant_settings")
      .select("currency_code")
      .eq("tenant_id", tenant.id)
      .maybeSingle();

    const planCode = normalisePricingPlanCode(body?.planCode || planCodeFromTenantPlanName(tenant.plan_name)) as PricingPlanCode;
    const currencyCode = normalisePricingCurrencyCode(body?.currencyCode || settings?.currency_code || "ZAR") as PricingCurrencyCode;
    const billingInterval = normaliseBillingInterval(body?.billingInterval || body?.billing || billingIntervalFromTenantPlanName(tenant.plan_name)) as BillingInterval;

    const session = await createStripeCheckoutSession(req, {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name || tenant.slug,
      ownerEmail: user.email,
      planCode,
      currencyCode,
      billingInterval,
    });

    await db
      .from("tenants")
      .update({ billing_provider: "stripe" })
      .eq("id", tenant.id);

    return jsonNoStore({
      checkoutUrl: session.url,
      sessionId: session.id,
      planCode,
      currencyCode,
      billingInterval,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start Stripe checkout.";
    return jsonNoStore({ error: message }, { status: 400 });
  }
}
