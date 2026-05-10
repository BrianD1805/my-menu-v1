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
    id?: string | null;
    status?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    cancelAt?: string | null;
    canceledAt?: string | null;
  } | null;
  recentWebhookEvents?: Array<{ id: string; event_type?: string | null; status?: string | null; processed_at?: string | null; created_at?: string | null; error_message?: string | null }>;
  recentStripePayments?: Array<{ id: string; billing_period_month?: string | null; subscription_amount?: number | null; currency_code?: string | null; payment_status?: string | null; payment_reference?: string | null; created_at?: string | null }>;
  error?: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatPaymentAmount(amount?: number | null, currency?: string | null) {
  const code = String(currency || "").trim().toUpperCase();
  if (typeof amount !== "number" || Number.isNaN(amount)) return code || "Amount unavailable";
  return `${code} ${amount}`.trim();
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

function subscriptionStatusText(subscription?: BillingStatusPayload["stripeSubscription"]) {
  if (!subscription?.status) return "Not linked yet";
  if (subscription.cancelAtPeriodEnd) return "Active — cancellation scheduled";
  return subscription.status;
}

export default function BillingStatusCheck() {
  const [payload, setPayload] = useState<BillingStatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"cancel_at_period_end" | "resume" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

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

  async function runBillingAction(action: "cancel_at_period_end" | "resume") {
    try {
      setActionLoading(action);
      setActionError(null);
      setActionMessage(null);
      const response = await fetch("/api/billing/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ action }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!response.ok) throw new Error(data.error || "Billing action failed.");
      setActionMessage(data.message || "Billing action completed.");
      setConfirmCancel(false);
      await loadStatus();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Billing action failed.");
    } finally {
      setActionLoading(null);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  const tenant = payload?.tenant;
  const stripeSubscription = payload?.stripeSubscription;
  const webhookEvents = payload?.recentWebhookEvents || [];
  const payments = payload?.recentStripePayments || [];
  const hasLinkedSubscription = Boolean(tenant?.billingSubscriptionId && stripeSubscription);
  const canManageSubscription = Boolean(hasLinkedSubscription && stripeSubscription?.status && !["canceled", "cancelled"].includes(stripeSubscription.status));
  const endLabel = stripeSubscription?.cancelAtPeriodEnd ? "Access ends" : "Next renewal";

  return (
    <div className="mt-5 rounded-[24px] border border-[#0E0E10]/10 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#0E0E10]">Subscription status check</p>
          <p className="mt-1 text-sm leading-6 text-[#5C5F66]">
            Checks whether Orduva has received the Stripe webhook, shows the renewal date, and gives safe subscription actions.
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
              <p className="mt-1 text-lg font-black">{subscriptionStatusText(stripeSubscription)}</p>
              <p className="mt-1 text-xs font-bold">{endLabel}: {formatDate(stripeSubscription?.currentPeriodEnd)}</p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-xs font-bold leading-5 text-[#5C5F66]">
            <p>Plan: <span className="text-[#0E0E10]">{tenant?.planName || "Not set"}</span></p>
            <p>Billing provider: <span className="text-[#0E0E10]">{tenant?.billingProvider || "Not set"}</span></p>
            <p>Customer: <span className="text-[#0E0E10]">{maskId(tenant?.billingCustomerId)}</span> · Subscription: <span className="text-[#0E0E10]">{maskId(tenant?.billingSubscriptionId)}</span></p>
            <p>{endLabel}: <span className="text-[#0E0E10]">{formatDateTime(stripeSubscription?.currentPeriodEnd)}</span></p>
            <p>Checked: <span className="text-[#0E0E10]">{formatDateTime(payload.checkedAt)}</span></p>
          </div>

          {canManageSubscription ? (
            <div className="mt-3 rounded-[22px] border border-[#0E0E10]/10 bg-white px-4 py-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#68707A]">Safe billing actions</p>
              {stripeSubscription?.cancelAtPeriodEnd ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900">
                  Cancellation is scheduled. The tenant stays active until {formatDate(stripeSubscription.currentPeriodEnd)}.
                </div>
              ) : (
                <p className="mt-2 text-sm font-bold leading-6 text-[#5C5F66]">
                  Cancel schedules the subscription to stop at the end of the current billing period. It does not immediately remove paid access.
                </p>
              )}

              {stripeSubscription?.cancelAtPeriodEnd ? (
                <button
                  type="button"
                  onClick={() => void runBillingAction("resume")}
                  disabled={Boolean(actionLoading)}
                  className="admin-pressable mt-3 inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
                >
                  {actionLoading === "resume" ? "Updating…" : "Keep subscription active"}
                </button>
              ) : (
                <div className="mt-3 space-y-3">
                  <label className="flex items-start gap-3 rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-sm font-bold leading-6 text-[#5C5F66]">
                    <input
                      type="checkbox"
                      checked={confirmCancel}
                      onChange={(event) => setConfirmCancel(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#0E0E10]/20"
                    />
                    <span>I understand this schedules cancellation at the period end and the store remains active until the paid period ends.</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => void runBillingAction("cancel_at_period_end")}
                    disabled={!confirmCancel || Boolean(actionLoading)}
                    className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-800 transition hover:-translate-y-[1px] hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading === "cancel_at_period_end" ? "Scheduling…" : "Cancel at period end"}
                  </button>
                </div>
              )}
              {actionMessage ? <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-900">{actionMessage}</p> : null}
              {actionError ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800">{actionError}</p> : null}
            </div>
          ) : null}

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
                    <span className="font-black text-[#0E0E10]">{formatPaymentAmount(payment.subscription_amount, payment.currency_code)}</span> · {payment.payment_status || "status unknown"} · Paid: {formatDateTime(payment.created_at)}
                    {payment.billing_period_month ? <p className="mt-0.5 text-[11px] font-bold text-[#68707A]">Billing period: {payment.billing_period_month}</p> : null}
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
