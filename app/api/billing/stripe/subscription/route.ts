import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import {
  loadTenantBillingStatus,
  retrieveStripeSubscriptionStatus,
  setStripeSubscriptionCancelAtPeriodEnd,
} from "@/lib/stripe-status";

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
    const action = String(body?.action || "").trim();
    const tenantBilling = await loadTenantBillingStatus(auth.tenant.id);
    const subscriptionId = tenantBilling?.billingSubscriptionId || "";
    if (!tenantBilling || !subscriptionId.startsWith("sub_")) {
      return jsonNoStore({ error: "This tenant does not have a linked Stripe subscription yet." }, { status: 400 });
    }

    const currentStripeSubscription = await retrieveStripeSubscriptionStatus(subscriptionId);
    if (!currentStripeSubscription?.id) {
      return jsonNoStore({ error: "Stripe subscription could not be found." }, { status: 404 });
    }

    if (action === "cancel_at_period_end") {
      const stripeSubscription = await setStripeSubscriptionCancelAtPeriodEnd(subscriptionId, true);
      return jsonNoStore({
        ok: true,
        action,
        message: "Cancellation scheduled. The subscription stays active until the end of the current billing period.",
        stripeSubscription,
      });
    }

    if (action === "resume") {
      const stripeSubscription = await setStripeSubscriptionCancelAtPeriodEnd(subscriptionId, false);
      return jsonNoStore({
        ok: true,
        action,
        message: "Scheduled cancellation removed. The subscription will continue renewing.",
        stripeSubscription,
      });
    }

    return jsonNoStore({ error: "Unknown billing action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Billing action failed.";
    return jsonNoStore({ error: message }, { status: 400 });
  }
}
