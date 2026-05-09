import { db } from "@/lib/db";
import { BillingInterval, PricingCurrencyCode, PricingPlanCode, normalisePricingCurrencyCode, normalisePricingPlanCode } from "@/lib/pricing";
import { normaliseBillingInterval } from "@/lib/stripe-checkout";

export type StripeSessionStatus = {
  id: string;
  status: string;
  paymentStatus: string;
  customerId: string;
  subscriptionId: string;
  tenantId: string;
  tenantSlug: string;
  planCode: PricingPlanCode;
  currencyCode: PricingCurrencyCode;
  billingInterval: BillingInterval;
  amountTotal: number | null;
  currency: string;
};

export type TenantBillingStatus = {
  id: string;
  slug: string;
  name: string | null;
  trialStatus: string | null;
  subscriptionStatus: string | null;
  planName: string | null;
  billingProvider: string | null;
  billingCustomerId: string | null;
  billingSubscriptionId: string | null;
  billingMetadata?: Record<string, unknown> | null;
};

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function stripeMajorAmountFromMinor(amountMinor: unknown) {
  const parsed = Number(amountMinor);
  if (!Number.isFinite(parsed)) return null;
  return Math.round((parsed / 100) * 100) / 100;
}

export async function retrieveStripeCheckoutSession(sessionId: string): Promise<StripeSessionStatus | null> {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() || "";
  const cleanSessionId = String(sessionId || "").trim();
  if (!secretKey || !cleanSessionId.startsWith("cs_")) return null;

  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(cleanSessionId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as Record<string, any> | null;
  if (!response.ok || !data?.id) return null;

  const metadata = (data.metadata || {}) as Record<string, any>;
  return {
    id: getString(data.id),
    status: getString(data.status),
    paymentStatus: getString(data.payment_status),
    customerId: getString(data.customer),
    subscriptionId: getString(data.subscription),
    tenantId: getString(metadata.tenant_id || data.client_reference_id),
    tenantSlug: getString(metadata.tenant_slug),
    planCode: normalisePricingPlanCode(metadata.plan_code || metadata.plan || "starter"),
    currencyCode: normalisePricingCurrencyCode(metadata.currency_code || data.currency || "ZAR"),
    billingInterval: normaliseBillingInterval(metadata.billing_interval || metadata.billing || "monthly"),
    amountTotal: stripeMajorAmountFromMinor(data.amount_total),
    currency: getString(data.currency).toUpperCase(),
  };
}

export async function retrieveStripeSubscriptionStatus(subscriptionId: string) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim() || "";
  const cleanSubscriptionId = String(subscriptionId || "").trim();
  if (!secretKey || !cleanSubscriptionId.startsWith("sub_")) return null;

  const response = await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(cleanSubscriptionId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as Record<string, any> | null;
  if (!response.ok || !data?.id) return null;
  return {
    id: getString(data.id),
    status: getString(data.status),
    customerId: getString(data.customer),
    currentPeriodEnd: typeof data.current_period_end === "number" ? new Date(data.current_period_end * 1000).toISOString() : null,
    cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
  };
}

export async function loadTenantBillingStatus(tenantId: string): Promise<TenantBillingStatus | null> {
  if (!tenantId) return null;
  const { data, error } = await db
    .from("tenants")
    .select("id, slug, name, trial_status, subscription_status, plan_name, billing_provider, billing_customer_id, billing_subscription_id, billing_metadata")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) {
    const { data: fallback } = await db
      .from("tenants")
      .select("id, slug, name, trial_status, subscription_status, plan_name, billing_provider, billing_customer_id, billing_subscription_id")
      .eq("id", tenantId)
      .maybeSingle();
    if (!fallback) return null;
    return {
      id: fallback.id,
      slug: fallback.slug,
      name: fallback.name,
      trialStatus: fallback.trial_status,
      subscriptionStatus: fallback.subscription_status,
      planName: fallback.plan_name,
      billingProvider: fallback.billing_provider,
      billingCustomerId: fallback.billing_customer_id,
      billingSubscriptionId: fallback.billing_subscription_id,
    };
  }

  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    trialStatus: data.trial_status,
    subscriptionStatus: data.subscription_status,
    planName: data.plan_name,
    billingProvider: data.billing_provider,
    billingCustomerId: data.billing_customer_id,
    billingSubscriptionId: data.billing_subscription_id,
    billingMetadata: data.billing_metadata || null,
  };
}

function webhookEventTenantId(row: Record<string, any>) {
  const object = row?.payload?.data?.object || {};
  return getString(
    object?.metadata?.tenant_id ||
      object?.subscription_details?.metadata?.tenant_id ||
      object?.parent?.subscription_details?.metadata?.tenant_id ||
      object?.client_reference_id,
  );
}

export async function loadRecentStripeWebhookEvents(tenantId: string, limit = 6) {
  const { data, error } = await db
    .from("stripe_webhook_events")
    .select("id, event_type, status, processed_at, error_message, created_at, payload")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) return [];
  return (data || [])
    .filter((row: any) => webhookEventTenantId(row) === tenantId)
    .slice(0, limit)
    .map(({ payload, ...row }: any) => row);
}

export async function loadRecentTenantStripePayments(tenantId: string, limit = 4) {
  const { data, error } = await db
    .from("tenant_subscription_payments")
    .select("id, billing_period_month, subscription_amount, currency_code, payment_status, payment_reference, created_at")
    .eq("tenant_id", tenantId)
    .eq("payment_source", "stripe")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}
