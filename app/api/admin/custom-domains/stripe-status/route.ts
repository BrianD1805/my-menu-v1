import { NextResponse } from "next/server";
import { requireAdminApiUser } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import {
  isCustomDomainStripeCheckoutPaid,
  retrieveCustomDomainStripeCheckoutSession,
} from "@/lib/custom-domain-stripe";

function jsonNoStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return response;
}

function cleanText(value: unknown, max = 160) {
  return String(value || "").trim().slice(0, max);
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = cleanText(body?.sessionId);
    const domainId = cleanText(body?.domainId, 120);
    if (!sessionId || !domainId) {
      return jsonNoStore({ error: "Stripe session id and custom domain id are required." }, { status: 400 });
    }

    const { data: domain, error } = await db
      .from("tenant_custom_domains")
      .select("id, tenant_id, domain_name, stripe_checkout_session_id")
      .eq("id", domainId)
      .eq("tenant_id", auth.tenant.id)
      .maybeSingle();

    if (error || !domain) {
      return jsonNoStore({ error: "Custom domain request was not found for this store." }, { status: 404 });
    }

    const session = await retrieveCustomDomainStripeCheckoutSession(sessionId);
    if (session.metadata?.custom_domain_id !== domain.id) {
      return jsonNoStore({ error: "Stripe session does not match this custom domain request." }, { status: 400 });
    }
    if (session.metadata?.tenant_id !== auth.tenant.id) {
      return jsonNoStore({ error: "Stripe session does not match this store." }, { status: 400 });
    }

    const paid = isCustomDomainStripeCheckoutPaid(session);
    const update: Record<string, unknown> = {
      stripe_checkout_session_id: session.id,
      stripe_customer_id: session.customerId || null,
      stripe_subscription_id: session.subscriptionId || null,
      updated_at: new Date().toISOString(),
    };

    if (paid) {
      update.billing_status = "active";
      update.status = "pending_dns";
      update.dns_apex_record_status = "pending";
      update.dns_www_record_status = "pending";
      update.netlify_alias_status = "pending";
      update.ssl_certificate_status = "pending";
      update.owner_notes = "Stripe custom-domain add-on payment completed. DNS setup can now continue.";
    }

    await db
      .from("tenant_custom_domains")
      .update(update)
      .eq("id", domain.id)
      .eq("tenant_id", auth.tenant.id);

    return jsonNoStore({
      ok: true,
      paid,
      status: session.status,
      paymentStatus: session.paymentStatus,
      subscriptionId: session.subscriptionId,
      customerId: session.customerId,
    });
  } catch (error) {
    return jsonNoStore(
      { error: error instanceof Error ? error.message : "Could not verify custom-domain Stripe checkout." },
      { status: 400 },
    );
  }
}
