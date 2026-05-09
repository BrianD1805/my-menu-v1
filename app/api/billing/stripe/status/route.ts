import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import {
  loadRecentStripeWebhookEvents,
  loadRecentTenantStripePayments,
  loadTenantBillingStatus,
  retrieveStripeSubscriptionStatus,
} from "@/lib/stripe-status";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

export async function GET(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  const tenantBilling = await loadTenantBillingStatus(auth.tenant.id);
  const stripeSubscription = tenantBilling?.billingSubscriptionId
    ? await retrieveStripeSubscriptionStatus(tenantBilling.billingSubscriptionId)
    : null;
  const [recentWebhookEvents, recentStripePayments] = await Promise.all([
    loadRecentStripeWebhookEvents(auth.tenant.id, 6),
    loadRecentTenantStripePayments(auth.tenant.id, 4),
  ]);

  const localActive = tenantBilling?.subscriptionStatus === "active" || tenantBilling?.trialStatus === "converted";
  const stripeActive = stripeSubscription ? ["active", "trialing"].includes(stripeSubscription.status) : null;

  return jsonNoStore({
    ok: true,
    checkedAt: new Date().toISOString(),
    localActive,
    stripeActive,
    tenant: tenantBilling,
    stripeSubscription,
    recentWebhookEvents,
    recentStripePayments,
  });
}
