"use client";

import { useEffect, useState } from "react";

type BillingStatusPayload = {
  ok?: boolean;
  checkedAt?: string;
  localActive?: boolean;
  stripeActive?: boolean | null;
  tenant?: {
    subscriptionStatus?: string | null;
    trialStatus?: string | null;
    planName?: string | null;
    billingProvider?: string | null;
    billingCustomerId?: string | null;
    billingSubscriptionId?: string | null;
  } | null;
  stripeSubscription?: {
    status?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  } | null;
  recentWebhookEvents?: Array<{ id: string; event_type?: string | null; status?: string | null; processed_at?: string | null; created_at?: string | null; error_message?: string | null }>;
  recentStripePayments?: Array<{ id: string; billing_period_month?: string | null; subscription_amount?: number | null; currency_code?: string | null; payment_status?: string | null; payment_reference?: string | null; created_at?: string | null }>;
  error?: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function maskId(value?: string | null) {
  const clean = String(value || "").trim();
  if (!clean) return "Not set";
  if (clean.length <= 14) return clean;
  return `${clean.slice(0, 8)}…${clean.slice(-6)}`;
}

function statusClass(active?: boolean | null) {
  if (active === true) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (active === false) return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-[#0E0E10]/10 bg-white text-[#5C5F66]";
}

export default function BillingStatusCheck() {
  const [payload, setPayload] = useState<BillingStatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/billing/stripe/status", { cache: "no-store", credentials: "same-origin" });
      const data = (await response.json().catch(() => ({}))) as BillingStatusPayload;
      if (!response.ok) throw new Error(data.error || "Could not check billing status.");
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check billing status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  const tenant = payload?.tenant;
  const stripeSubscription = payload?.stripeSubscription;
  const webhookEvents = payload?.recentWebhookEvents || [];
  const payments = payload?.recentStripePayments || [];

  return (
    <div className="mt-5 rounded-[24px] border border-[#0E0E10]/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#0E0E10]">Subscription status check</p>
          <p className="mt-1 text-sm leading-6 text-[#5C5F66]">
            Checks whether Orduva has received the Stripe webhook and whether the tenant subscription is marked active.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadStatus()}
          disabled={loading}
          className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-[#FFF7F0] px-4 py-2 text-sm font-black text-[#0E0E10] transition hover:-translate-y-[1px] hover:border-[#FF6A3D]/30 disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? "Checking…" : "Refresh status"}
        </button>
      </div>

      {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800">{error}</p> : null}

      {payload ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className={`rounded-2xl border px-4 py-3 ${statusClass(payload.localActive)}`}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-75">Orduva tenant</p>
              <p className="mt-1 text-lg font-black">{payload.localActive ? "Active" : "Not active yet"}</p>
              <p className="mt-1 text-xs font-bold">Subscription: {tenant?.subscriptionStatus || "unknown"} · Trial: {tenant?.trialStatus || "unknown"}</p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${statusClass(payload.stripeActive)}`}>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-75">Stripe subscription</p>
              <p className="mt-1 text-lg font-black">{stripeSubscription?.status || "Not linked yet"}</p>
              <p className="mt-1 text-xs font-bold">Current period end: {formatDateTime(stripeSubscription?.currentPeriodEnd)}</p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-xs font-bold leading-5 text-[#5C5F66]">
            <p>Plan: <span className="text-[#0E0E10]">{tenant?.planName || "Not set"}</span></p>
            <p>Billing provider: <span className="text-[#0E0E10]">{tenant?.billingProvider || "Not set"}</span></p>
            <p>Customer: <span className="text-[#0E0E10]">{maskId(tenant?.billingCustomerId)}</span> · Subscription: <span className="text-[#0E0E10]">{maskId(tenant?.billingSubscriptionId)}</span></p>
            <p>Checked: <span className="text-[#0E0E10]">{formatDateTime(payload.checkedAt)}</span></p>
          </div>

          {webhookEvents.length ? (
            <div className="mt-3 rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#68707A]">Recent Stripe webhook events</p>
              <div className="mt-2 space-y-2">
                {webhookEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-xs font-bold leading-5 text-[#5C5F66]">
                    <span className="font-black text-[#0E0E10]">{event.event_type}</span> · {event.status} · {formatDateTime(event.processed_at || event.created_at)}
                    {event.error_message ? <p className="text-red-700">{event.error_message}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {payments.length ? (
            <div className="mt-3 rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#68707A]">Recent Stripe payment records</p>
              <div className="mt-2 space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-xs font-bold leading-5 text-[#5C5F66]">
                    <span className="font-black text-[#0E0E10]">{payment.currency_code} {payment.subscription_amount}</span> · {payment.payment_status} · {payment.billing_period_month || "period unknown"}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
