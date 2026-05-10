"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";

type CurrencyTotal = {
  currencyCode: string;
  amount: number;
  payments: number;
};

type BillingStore = {
  id: string;
  name: string;
  slug: string;
  createdAt: string | null;
  trialEndsAt: string | null;
  subscriptionStatus: string;
  trialStatus: string;
  planName: string | null;
  planLabel: string;
  billingProvider: string;
  billingState: string;
  hasStripeLink: boolean;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  lastPayment: {
    amount: number;
    currencyCode: string;
    status: string;
    paidAt: string | null;
    billingPeriodMonth: string | null;
    reference: string | null;
  } | null;
};

type RecentPayment = {
  id: string;
  tenantId: string | null;
  storeName: string;
  storeSlug: string;
  amount: number;
  currencyCode: string;
  status: string;
  paidAt: string | null;
  billingPeriodMonth: string | null;
  reference: string | null;
};

type BillingOverviewPayload = {
  ok?: boolean;
  checkedAt?: string;
  summary: {
    totalStores: number;
    activeBilling: number;
    trialStores: number;
    paymentAttention: number;
    expiredOrCancelled: number;
    missingStripeLink: number;
    paidPaymentCount: number;
    currentMonthRevenue: CurrencyTotal[];
    last30DaysRevenue: CurrencyTotal[];
  };
  stores: BillingStore[];
  recentPayments: RecentPayment[];
  error?: string;
};

type BillingFilter = "all" | "active" | "trial" | "attention" | "ended" | "missingLink";

const EMPTY_PAYLOAD: BillingOverviewPayload = {
  summary: {
    totalStores: 0,
    activeBilling: 0,
    trialStores: 0,
    paymentAttention: 0,
    expiredOrCancelled: 0,
    missingStripeLink: 0,
    paidPaymentCount: 0,
    currentMonthRevenue: [],
    last30DaysRevenue: [],
  },
  stores: [],
  recentPayments: [],
};

function money(amount: number | null | undefined, currencyCode: string | null | undefined) {
  const code = String(currencyCode || "").trim().toUpperCase() || "";
  const value = Number(amount || 0);
  if (!Number.isFinite(value)) return code || "Amount unavailable";
  return `${code} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`.trim();
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function billingStateLabel(state: string) {
  if (state === "active") return "Active billing";
  if (state === "trial") return "Trial";
  if (state === "payment_attention") return "Payment attention";
  if (state === "cancelled") return "Cancelled";
  if (state === "expired") return "Expired";
  return "Check billing";
}

function billingStateClasses(state: string) {
  if (state === "active") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (state === "trial") return "border-[#FFB168]/40 bg-[#FFF7F0] text-[#8A3C18]";
  if (state === "payment_attention") return "border-red-200 bg-red-50 text-red-900";
  if (state === "cancelled" || state === "expired") return "border-slate-200 bg-slate-50 text-slate-800";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function revenueLine(totals: CurrencyTotal[]) {
  if (!totals.length) return "No paid Stripe records yet";
  return totals.map((item) => `${money(item.amount, item.currencyCode)} (${item.payments})`).join(" · ");
}

function filterTitle(filter: BillingFilter) {
  if (filter === "active") return "Active billing tenants";
  if (filter === "trial") return "Trial tenants";
  if (filter === "attention") return "Payment attention";
  if (filter === "ended") return "Ended / expired billing";
  if (filter === "missingLink") return "Active tenants missing Stripe links";
  return "All billing records";
}

function matchesFilter(store: BillingStore, filter: BillingFilter) {
  if (filter === "all") return true;
  if (filter === "active") return store.billingState === "active";
  if (filter === "trial") return store.billingState === "trial";
  if (filter === "attention") return store.billingState === "payment_attention";
  if (filter === "ended") return ["cancelled", "expired"].includes(store.billingState);
  if (filter === "missingLink") return store.billingState === "active" && !store.hasStripeLink;
  return true;
}

export default function OwnerBillingOverviewPanel() {
  const ownerAccess = useOwnerPlatformAccess();
  const [payload, setPayload] = useState<BillingOverviewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState<BillingFilter>("all");
  const canLoad = ownerAccess.unlocked && Boolean(ownerAccess.platformKey);

  const loadBillingOverview = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setMessage("Loading billing overview...");
    try {
      const response = await fetch("/api/platform/billing-overview", {
        cache: "no-store",
        headers: ownerAccess.platformHeaders,
      });
      const data = (await response.json().catch(() => ({}))) as BillingOverviewPayload;
      if (!response.ok) throw new Error(data?.error || "Could not load billing overview.");
      setPayload(data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load billing overview.");
    } finally {
      setLoading(false);
    }
  }, [canLoad, ownerAccess.platformHeaders]);

  useEffect(() => {
    void loadBillingOverview();
  }, [loadBillingOverview]);

  const data = payload || EMPTY_PAYLOAD;
  const filteredStores = useMemo(
    () => data.stores.filter((store) => matchesFilter(store, activeFilter)),
    [data.stores, activeFilter],
  );

  const cards: Array<{ key: BillingFilter; label: string; value: number; hint: string; classes: string }> = [
    { key: "all", label: "Billing records", value: data.summary.totalStores, hint: "All tenants", classes: "border-[#0E0E10]/10 bg-white text-[#0E0E10]" },
    { key: "active", label: "Active billing", value: data.summary.activeBilling, hint: "Paying tenants", classes: "border-emerald-200 bg-emerald-50 text-emerald-900" },
    { key: "trial", label: "Trials", value: data.summary.trialStores, hint: "Not paid yet", classes: "border-[#FFB168]/45 bg-[#FFF7F0] text-[#8A3C18]" },
    { key: "attention", label: "Payment attention", value: data.summary.paymentAttention, hint: "Past due / unpaid", classes: "border-red-200 bg-red-50 text-red-900" },
    { key: "ended", label: "Ended", value: data.summary.expiredOrCancelled, hint: "Expired or cancelled", classes: "border-slate-200 bg-slate-50 text-slate-800" },
    { key: "missingLink", label: "Missing Stripe link", value: data.summary.missingStripeLink, hint: "Active but not linked", classes: "border-amber-200 bg-amber-50 text-amber-900" },
  ];

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#0E0E10]/10 bg-white shadow-[0_18px_50px_rgba(14,14,16,0.08)]">
      <div className="bg-gradient-to-br from-[#0E0E10] via-[#17171A] to-[#3A241A] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFB168]">Owner billing</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Billing overview</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
              A quick owner-level view of tenant billing states, recent Stripe payments, and any records that need attention.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadBillingOverview()}
            disabled={loading || !canLoad}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-[#FFF7F0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh billing"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[22px] border border-white/10 bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/65">This month</p>
            <p className="mt-2 text-xl font-black leading-tight text-white">{revenueLine(data.summary.currentMonthRevenue)}</p>
            <p className="mt-2 text-xs font-bold text-white/58">Captured Stripe payment records in the current calendar month.</p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/65">Last 30 days</p>
            <p className="mt-2 text-xl font-black leading-tight text-white">{revenueLine(data.summary.last30DaysRevenue)}</p>
            <p className="mt-2 text-xs font-bold text-white/58">Useful for a fast rolling billing health check.</p>
          </div>
          <div className="rounded-[22px] border border-[#FFB168]/30 bg-[#FFB168]/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#FFE1C7]">Paid payment records</p>
            <p className="mt-2 text-3xl font-black leading-none text-white">{data.summary.paidPaymentCount}</p>
            <p className="mt-2 text-xs font-bold text-white/58">Recorded from Stripe webhook payment events.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#0E0E10]/10 p-5 sm:p-6">
        {message ? (
          <p className="mb-4 rounded-2xl border border-[#FF6A3D]/20 bg-[#FFF7F0] px-4 py-3 text-sm font-bold text-[#C84F2A]">{message}</p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {cards.map((card) => {
            const selected = activeFilter === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setActiveFilter(card.key)}
                className={`rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 ${card.classes} ${selected ? "ring-2 ring-[#FF6A3D] ring-offset-2" : ""}`}
                aria-pressed={selected}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">{card.label}</p>
                <p className="mt-2 text-3xl font-black leading-none">{card.value}</p>
                <p className="mt-2 text-xs font-bold opacity-70">{card.hint}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[26px] border border-[#0E0E10]/10 bg-[#FFF7F0] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Selected billing view</p>
                <h3 className="mt-1 text-xl font-black text-[#0E0E10]">{filterTitle(activeFilter)}</h3>
              </div>
              <p className="text-sm font-bold text-[#68707A]">Showing {filteredStores.length} of {data.summary.totalStores} tenants</p>
            </div>

            <div className="mt-4 space-y-3">
              {filteredStores.length ? (
                filteredStores.map((store) => (
                  <article key={store.id} className="rounded-[22px] border border-[#0E0E10]/10 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-black text-[#0E0E10]">{store.name}</h4>
                          <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${billingStateClasses(store.billingState)}`}>
                            {billingStateLabel(store.billingState)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-[#68707A]">{store.slug ? `${store.slug}.orduva.com` : "No slug"}</p>
                      </div>
                      <div className="text-left text-xs font-bold leading-5 text-[#68707A] lg:text-right">
                        <p>Plan: <span className="text-[#0E0E10]">{store.planLabel}</span></p>
                        <p>Provider: <span className="text-[#0E0E10]">{store.billingProvider}</span></p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-[#0E0E10]/8 bg-[#F8FAFC] px-3 py-2 text-xs font-bold leading-5 text-[#68707A]">
                        <p className="uppercase tracking-[0.12em] text-[#8B929C]">Stripe link</p>
                        <p className="mt-1 text-[#0E0E10]">{store.hasStripeLink ? "Linked" : "Not fully linked"}</p>
                        <p>{store.stripeCustomerId} · {store.stripeSubscriptionId}</p>
                      </div>
                      <div className="rounded-2xl border border-[#0E0E10]/8 bg-[#F8FAFC] px-3 py-2 text-xs font-bold leading-5 text-[#68707A]">
                        <p className="uppercase tracking-[0.12em] text-[#8B929C]">Last payment</p>
                        {store.lastPayment ? (
                          <>
                            <p className="mt-1 text-[#0E0E10]">{money(store.lastPayment.amount, store.lastPayment.currencyCode)} · {store.lastPayment.status}</p>
                            <p>{formatDateTime(store.lastPayment.paidAt)}</p>
                          </>
                        ) : (
                          <p className="mt-1 text-[#0E0E10]">No Stripe payment recorded</p>
                        )}
                      </div>
                      <div className="rounded-2xl border border-[#0E0E10]/8 bg-[#F8FAFC] px-3 py-2 text-xs font-bold leading-5 text-[#68707A]">
                        <p className="uppercase tracking-[0.12em] text-[#8B929C]">Local status</p>
                        <p className="mt-1 text-[#0E0E10]">Subscription: {store.subscriptionStatus}</p>
                        <p>Trial ends: {formatDate(store.trialEndsAt)}</p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[22px] border border-[#0E0E10]/10 bg-white p-5 text-sm font-bold text-[#68707A]">No tenants match this billing view.</div>
              )}
            </div>
          </div>

          <aside className="rounded-[26px] border border-[#0E0E10]/10 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Recent Stripe payments</p>
                <h3 className="mt-1 text-xl font-black text-[#0E0E10]">Latest records</h3>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {data.recentPayments.length ? (
                data.recentPayments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3">
                    <p className="text-sm font-black text-[#0E0E10]">{money(payment.amount, payment.currencyCode)} · {payment.status}</p>
                    <p className="mt-1 text-xs font-bold text-[#68707A]">{payment.storeName}</p>
                    <p className="mt-1 text-xs font-semibold text-[#8B929C]">Paid: {formatDateTime(payment.paidAt)}</p>
                    {payment.billingPeriodMonth ? <p className="mt-0.5 text-[11px] font-semibold text-[#8B929C]">Billing period: {payment.billingPeriodMonth}</p> : null}
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#68707A]">No Stripe payment records yet.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
