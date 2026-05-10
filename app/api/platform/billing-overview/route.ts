import { NextResponse } from "next/server";
import { requirePlatformAccess } from "@/lib/platform-security";
import { db } from "@/lib/db";

type TenantRow = {
  id: string;
  name: string | null;
  slug: string | null;
  status: string | null;
  created_at: string | null;
  trial_status: string | null;
  trial_ends_at: string | null;
  subscription_status: string | null;
  plan_name: string | null;
  billing_provider: string | null;
  billing_customer_id: string | null;
  billing_subscription_id: string | null;
};

type PaymentRow = {
  id: string;
  tenant_id: string | null;
  billing_period_month: string | null;
  subscription_amount: number | null;
  currency_code: string | null;
  payment_source: string | null;
  payment_status: string | null;
  payment_reference: string | null;
  created_at: string | null;
};

type CurrencyTotal = {
  currencyCode: string;
  amount: number;
  payments: number;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isPaidPayment(payment: PaymentRow) {
  const status = clean(payment.payment_status).toLowerCase();
  return ["paid", "succeeded", "complete", "completed"].includes(status);
}

function normaliseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isCurrentCalendarMonth(value: string | null) {
  const date = normaliseDate(value);
  if (!date) return false;
  const now = new Date();
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

function isLast30Days(value: string | null) {
  const date = normaliseDate(value);
  if (!date) return false;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return date.getTime() >= thirtyDaysAgo;
}

function planLabel(planName: string | null) {
  const value = clean(planName).toLowerCase();
  if (!value || value === "orduva_trial") return "Trial";
  const plan = value.includes("pro") ? "Pro" : value.includes("growth") ? "Growth" : value.includes("starter") ? "Starter" : clean(planName);
  const interval = value.includes("yearly") ? "Yearly" : value.includes("monthly") ? "Monthly" : "";
  return [plan, interval].filter(Boolean).join(" · ");
}

function billingState(tenant: TenantRow) {
  const subscriptionStatus = clean(tenant.subscription_status).toLowerCase();
  const trialStatus = clean(tenant.trial_status).toLowerCase();
  if (subscriptionStatus === "active" || trialStatus === "converted") return "active";
  if (subscriptionStatus === "past_due" || subscriptionStatus === "unpaid") return "payment_attention";
  if (subscriptionStatus === "cancelled" || subscriptionStatus === "canceled") return "cancelled";
  if (subscriptionStatus === "expired" || trialStatus === "expired") return "expired";
  if (subscriptionStatus === "trial" || trialStatus === "trial" || trialStatus === "active") return "trial";
  return subscriptionStatus || trialStatus || "unknown";
}

function addCurrencyTotal(map: Map<string, CurrencyTotal>, currencyCode: string | null, amount: number | null) {
  const code = clean(currencyCode).toUpperCase() || "UNKNOWN";
  const value = Number(amount || 0);
  if (!Number.isFinite(value) || value <= 0) return;
  const current = map.get(code) || { currencyCode: code, amount: 0, payments: 0 };
  current.amount = Math.round((current.amount + value) * 100) / 100;
  current.payments += 1;
  map.set(code, current);
}

function currencyTotalsFrom(payments: PaymentRow[]) {
  const map = new Map<string, CurrencyTotal>();
  for (const payment of payments) addCurrencyTotal(map, payment.currency_code, payment.subscription_amount);
  return Array.from(map.values()).sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));
}

export async function GET(req: Request) {
  const accessError = await requirePlatformAccess(req);
  if (accessError) return accessError;

  try {
    const { data: tenants, error: tenantsError } = await db
      .from("tenants")
      .select("id, name, slug, status, created_at, trial_status, trial_ends_at, subscription_status, plan_name, billing_provider, billing_customer_id, billing_subscription_id")
      .order("created_at", { ascending: false })
      .limit(500);

    if (tenantsError) return NextResponse.json({ error: "Failed to load tenant billing overview." }, { status: 500 });

    const tenantRows = (tenants || []) as TenantRow[];
    const tenantIds = tenantRows.map((tenant) => tenant.id);

    let payments: PaymentRow[] = [];
    if (tenantIds.length) {
      const { data: paymentRows, error: paymentsError } = await db
        .from("tenant_subscription_payments")
        .select("id, tenant_id, billing_period_month, subscription_amount, currency_code, payment_source, payment_status, payment_reference, created_at")
        .in("tenant_id", tenantIds)
        .eq("payment_source", "stripe")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (!paymentsError) payments = (paymentRows || []) as PaymentRow[];
    }

    const paymentsByTenant = new Map<string, PaymentRow[]>();
    for (const payment of payments) {
      if (!payment.tenant_id) continue;
      const list = paymentsByTenant.get(payment.tenant_id) || [];
      list.push(payment);
      paymentsByTenant.set(payment.tenant_id, list);
    }

    const paidPayments = payments.filter(isPaidPayment);
    const currentMonthPaidPayments = paidPayments.filter((payment) => isCurrentCalendarMonth(payment.created_at));
    const last30DayPaidPayments = paidPayments.filter((payment) => isLast30Days(payment.created_at));

    const stores = tenantRows.map((tenant) => {
      const tenantPayments = paymentsByTenant.get(tenant.id) || [];
      const lastPayment = tenantPayments[0] || null;
      const state = billingState(tenant);
      const hasStripeCustomer = clean(tenant.billing_customer_id).startsWith("cus_");
      const hasStripeSubscription = clean(tenant.billing_subscription_id).startsWith("sub_");
      return {
        id: tenant.id,
        name: tenant.name || tenant.slug || "Unnamed store",
        slug: tenant.slug || "",
        createdAt: tenant.created_at,
        trialEndsAt: tenant.trial_ends_at,
        subscriptionStatus: tenant.subscription_status || "unknown",
        trialStatus: tenant.trial_status || "unknown",
        planName: tenant.plan_name || null,
        planLabel: planLabel(tenant.plan_name),
        billingProvider: tenant.billing_provider || "Not set",
        billingState: state,
        hasStripeCustomer,
        hasStripeSubscription,
        hasStripeLink: hasStripeCustomer && hasStripeSubscription,
        stripeCustomerId: hasStripeCustomer ? `${clean(tenant.billing_customer_id).slice(0, 8)}…` : "Not linked",
        stripeSubscriptionId: hasStripeSubscription ? `${clean(tenant.billing_subscription_id).slice(0, 8)}…` : "Not linked",
        lastPayment: lastPayment
          ? {
              amount: Number(lastPayment.subscription_amount || 0),
              currencyCode: clean(lastPayment.currency_code).toUpperCase() || "UNKNOWN",
              status: lastPayment.payment_status || "unknown",
              paidAt: lastPayment.created_at,
              billingPeriodMonth: lastPayment.billing_period_month,
              reference: lastPayment.payment_reference || null,
            }
          : null,
      };
    });

    return NextResponse.json({
      ok: true,
      checkedAt: new Date().toISOString(),
      summary: {
        totalStores: stores.length,
        activeBilling: stores.filter((store) => store.billingState === "active").length,
        trialStores: stores.filter((store) => store.billingState === "trial").length,
        paymentAttention: stores.filter((store) => store.billingState === "payment_attention").length,
        expiredOrCancelled: stores.filter((store) => ["expired", "cancelled"].includes(store.billingState)).length,
        missingStripeLink: stores.filter((store) => store.billingState === "active" && !store.hasStripeLink).length,
        paidPaymentCount: paidPayments.length,
        currentMonthRevenue: currencyTotalsFrom(currentMonthPaidPayments),
        last30DaysRevenue: currencyTotalsFrom(last30DayPaidPayments),
      },
      stores,
      recentPayments: payments.slice(0, 8).map((payment) => {
        const tenant = tenantRows.find((row) => row.id === payment.tenant_id);
        return {
          id: payment.id,
          tenantId: payment.tenant_id,
          storeName: tenant?.name || tenant?.slug || "Unknown store",
          storeSlug: tenant?.slug || "",
          amount: Number(payment.subscription_amount || 0),
          currencyCode: clean(payment.currency_code).toUpperCase() || "UNKNOWN",
          status: payment.payment_status || "unknown",
          paidAt: payment.created_at,
          billingPeriodMonth: payment.billing_period_month,
          reference: payment.payment_reference || null,
        };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load billing overview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
