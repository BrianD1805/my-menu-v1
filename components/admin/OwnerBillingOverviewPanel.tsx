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
  paymentRecords?: RecentPayment[];
  error?: string;
};

type BillingFilter = "all" | "alerts" | "active" | "trial" | "attention" | "ended" | "missingLink";

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
  paymentRecords: [],
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


type BillingAlert = {
  key: string;
  label: string;
  detail: string;
  level: "critical" | "warning" | "info";
};

function daysUntil(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function daysSince(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
}

function getBillingAlerts(store: BillingStore): BillingAlert[] {
  const alerts: BillingAlert[] = [];
  const subscriptionStatus = String(store.subscriptionStatus || "").toLowerCase();
  const trialStatus = String(store.trialStatus || "").toLowerCase();
  const paymentStatus = String(store.lastPayment?.status || "").toLowerCase();
  const trialDays = daysUntil(store.trialEndsAt);
  const paymentDays = daysSince(store.lastPayment?.paidAt || null);

  if (store.billingState === "payment_attention" || ["past_due", "unpaid", "incomplete", "incomplete_expired"].includes(subscriptionStatus)) {
    alerts.push({ key: "payment-attention", label: "Payment attention", detail: "Stripe/local status needs checking before access or renewal is trusted.", level: "critical" });
  }

  if (store.billingState === "active" && !store.hasStripeLink) {
    alerts.push({ key: "missing-stripe-link", label: "Missing Stripe link", detail: "Tenant is active but customer/subscription IDs are not both linked.", level: "critical" });
  }

  if (store.billingState === "active" && !store.lastPayment) {
    alerts.push({ key: "no-payment-record", label: "No Stripe payment record", detail: "Tenant is active but no Stripe payment record is visible in Orduva.", level: "warning" });
  }

  if (store.billingState === "active" && paymentDays !== null && paymentDays > 45) {
    alerts.push({ key: "old-payment-record", label: "Old payment record", detail: `Last recorded Stripe payment is ${paymentDays} days old. Check if this is a yearly plan or a missed renewal.`, level: "warning" });
  }

  if (["failed", "unpaid", "past_due", "requires_payment_method", "payment_failed"].includes(paymentStatus)) {
    alerts.push({ key: "failed-payment", label: "Failed payment", detail: "The latest payment record is not paid/succeeded.", level: "critical" });
  }

  if (store.billingState === "trial" && trialDays !== null && trialDays >= 0 && trialDays <= 3) {
    alerts.push({ key: "trial-ending-soon", label: "Trial ending soon", detail: `Trial ends in ${trialDays} day${trialDays === 1 ? "" : "s"}. Follow up before checkout is blocked.`, level: "warning" });
  } else if (store.billingState === "trial" && trialDays !== null && trialDays >= 4 && trialDays <= 7) {
    alerts.push({ key: "trial-ending-this-week", label: "Trial ending this week", detail: `Trial ends in ${trialDays} days.`, level: "info" });
  }

  if ((store.billingState === "trial" || trialStatus === "active") && trialDays !== null && trialDays < 0) {
    alerts.push({ key: "trial-overdue", label: "Trial date passed", detail: `Trial end date passed ${Math.abs(trialDays)} day${Math.abs(trialDays) === 1 ? "" : "s"} ago.`, level: "critical" });
  }

  if (["cancel_at_period_end", "cancellation_scheduled", "active_cancel_at_period_end"].includes(subscriptionStatus)) {
    alerts.push({ key: "cancellation-scheduled", label: "Cancellation scheduled", detail: "Tenant remains active until paid access ends; follow up if this was accidental.", level: "warning" });
  }

  return alerts;
}

function alertClasses(level: BillingAlert["level"]) {
  if (level === "critical") return "border-red-200 bg-red-50 text-red-900";
  if (level === "warning") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-sky-200 bg-sky-50 text-sky-900";
}

function revenueLine(totals: CurrencyTotal[]) {
  if (!totals.length) return "No paid Stripe records yet";
  return totals.map((item) => `${money(item.amount, item.currencyCode)} (${item.payments})`).join(" · ");
}


function normaliseSearch(value: string) {
  return value.trim().toLowerCase();
}

function matchesSearch(store: BillingStore, searchTerm: string) {
  const query = normaliseSearch(searchTerm);
  if (!query) return true;
  const haystack = [
    store.name,
    store.slug,
    store.planLabel,
    store.billingProvider,
    store.billingState,
    store.subscriptionStatus,
    store.trialStatus,
    store.stripeCustomerId,
    store.stripeSubscriptionId,
    store.lastPayment?.currencyCode,
    store.lastPayment?.status,
    store.lastPayment?.reference,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function matchesPaymentSearch(payment: RecentPayment, searchTerm: string) {
  const query = normaliseSearch(searchTerm);
  if (!query) return true;
  const haystack = [
    payment.storeName,
    payment.storeSlug,
    payment.currencyCode,
    payment.status,
    payment.reference,
    payment.billingPeriodMonth,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  if (typeof window === "undefined") return;
  const csv = [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function filterTitle(filter: BillingFilter) {
  if (filter === "alerts") return "Tenants with alert flags";
  if (filter === "active") return "Active billing tenants";
  if (filter === "trial") return "Trial tenants";
  if (filter === "attention") return "Payment attention";
  if (filter === "ended") return "Ended / expired billing";
  if (filter === "missingLink") return "Active tenants missing Stripe links";
  return "All billing records";
}

function matchesFilter(store: BillingStore, filter: BillingFilter) {
  if (filter === "all") return true;
  if (filter === "alerts") return getBillingAlerts(store).length > 0;
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
  const [storeSearch, setStoreSearch] = useState("");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
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
    () => data.stores.filter((store) => matchesFilter(store, activeFilter) && matchesSearch(store, storeSearch)),
    [data.stores, activeFilter, storeSearch],
  );

  const alertStores = useMemo(() => data.stores.filter((store) => getBillingAlerts(store).length > 0), [data.stores]);
  const criticalAlertCount = useMemo(
    () => data.stores.reduce((count, store) => count + getBillingAlerts(store).filter((alert) => alert.level === "critical").length, 0),
    [data.stores],
  );
  const warningAlertCount = useMemo(
    () => data.stores.reduce((count, store) => count + getBillingAlerts(store).filter((alert) => alert.level === "warning").length, 0),
    [data.stores],
  );

  const paymentRecords = data.paymentRecords || data.recentPayments;
  const filteredPayments = useMemo(() => {
    return paymentRecords.filter((payment) => {
      const status = String(payment.status || "").toLowerCase();
      const statusMatch = paymentStatusFilter === "all" || status === paymentStatusFilter;
      return statusMatch && matchesPaymentSearch(payment, paymentSearch);
    });
  }, [paymentRecords, paymentSearch, paymentStatusFilter]);

  const paymentStatusOptions = useMemo(() => {
    const statuses = Array.from(new Set(paymentRecords.map((payment) => String(payment.status || "unknown").toLowerCase()))).filter(Boolean).sort();
    return ["all", ...statuses];
  }, [paymentRecords]);

  const exportBillingCsv = useCallback(() => {
    downloadCsv(
      `orduva-billing-tenants-${exportDateStamp()}.csv`,
      ["Store", "Slug", "Billing state", "Plan", "Provider", "Subscription status", "Trial status", "Trial ends", "Stripe linked", "Stripe customer", "Stripe subscription", "Last payment amount", "Last payment currency", "Last payment status", "Last payment date", "Last payment reference", "Alert flags"],
      filteredStores.map((store) => [
        store.name,
        store.slug,
        store.billingState,
        store.planLabel,
        store.billingProvider,
        store.subscriptionStatus,
        store.trialStatus,
        store.trialEndsAt || "",
        store.hasStripeLink ? "Yes" : "No",
        store.stripeCustomerId,
        store.stripeSubscriptionId,
        store.lastPayment?.amount ?? "",
        store.lastPayment?.currencyCode ?? "",
        store.lastPayment?.status ?? "",
        store.lastPayment?.paidAt ?? "",
        store.lastPayment?.reference ?? "",
        getBillingAlerts(store).map((alert) => alert.label).join(" | "),
      ]),
    );
  }, [filteredStores]);

  const exportPaymentsCsv = useCallback(() => {
    downloadCsv(
      `orduva-stripe-payments-${exportDateStamp()}.csv`,
      ["Store", "Slug", "Amount", "Currency", "Status", "Paid at", "Billing period", "Payment reference", "Tenant ID"],
      filteredPayments.map((payment) => [
        payment.storeName,
        payment.storeSlug,
        payment.amount,
        payment.currencyCode,
        payment.status,
        payment.paidAt || "",
        payment.billingPeriodMonth || "",
        payment.reference || "",
        payment.tenantId || "",
      ]),
    );
  }, [filteredPayments]);

  const cards: Array<{ key: BillingFilter; label: string; value: number; hint: string; classes: string }> = [
    { key: "all", label: "Billing records", value: data.summary.totalStores, hint: "All tenants", classes: "border-[#0E0E10]/10 bg-white text-[#0E0E10]" },
    { key: "alerts", label: "Alert flags", value: alertStores.length, hint: "Needs review", classes: "border-red-200 bg-red-50 text-red-900" },
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
              A cleaner owner-level view of tenant billing states, searchable Stripe payments, exportable billing records, and warning flags for tenants that need attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadBillingOverview()}
              disabled={loading || !canLoad}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-[#FFF7F0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh billing"}
            </button>
            <button
              type="button"
              onClick={exportBillingCsv}
              disabled={!filteredStores.length}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export tenants CSV
            </button>
            <button
              type="button"
              onClick={exportPaymentsCsv}
              disabled={!filteredPayments.length}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export payments CSV
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          <div className="rounded-[22px] border border-red-300/30 bg-red-500/10 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-100">Alert flags</p>
            <p className="mt-2 text-3xl font-black leading-none text-white">{alertStores.length}</p>
            <p className="mt-2 text-xs font-bold text-white/58">{criticalAlertCount} critical · {warningAlertCount} warning</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#0E0E10]/10 p-5 sm:p-6">
        {message ? (
          <p className="mb-4 rounded-2xl border border-[#FF6A3D]/20 bg-[#FFF7F0] px-4 py-3 text-sm font-bold text-[#C84F2A]">{message}</p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
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

            <div className="mt-4 rounded-[22px] border border-[#0E0E10]/10 bg-white p-3">
              <label className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8B929C]" htmlFor="owner-billing-search">Search tenant billing</label>
              <input
                id="owner-billing-search"
                value={storeSearch}
                onChange={(event) => setStoreSearch(event.target.value)}
                placeholder="Search by store, slug, plan, status, provider or Stripe reference"
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 text-sm font-bold text-[#0E0E10] outline-none transition focus:border-[#FF6A3D] focus:bg-white"
              />
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#68707A]">
                <span className="rounded-full bg-[#FFF7F0] px-3 py-1">Export uses the current filter/search</span>
                <span className="rounded-full bg-[#F8FAFC] px-3 py-1">{filteredStores.length} tenant rows ready</span>
                <span className="rounded-full bg-red-50 px-3 py-1 text-red-800">Alert flags show on exported tenant CSV</span>
              </div>
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
                        {getBillingAlerts(store).length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {getBillingAlerts(store).map((alert) => (
                              <span key={alert.key} title={alert.detail} className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] ${alertClasses(alert.level)}`}>
                                {alert.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-900">No alert flags</p>
                        )}
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
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Stripe payments</p>
                <h3 className="mt-1 text-xl font-black text-[#0E0E10]">Search & export</h3>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-[#0E0E10]/10 bg-[#FFF7F0] p-3">
              <label className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8B929C]" htmlFor="owner-payment-search">Search payments</label>
              <input
                id="owner-payment-search"
                value={paymentSearch}
                onChange={(event) => setPaymentSearch(event.target.value)}
                placeholder="Store, currency, status or reference"
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#0E0E10]/10 bg-white px-4 text-sm font-bold text-[#0E0E10] outline-none transition focus:border-[#FF6A3D]"
              />
              <label className="mt-3 block text-[11px] font-black uppercase tracking-[0.16em] text-[#8B929C]" htmlFor="owner-payment-status">Payment status</label>
              <select
                id="owner-payment-status"
                value={paymentStatusFilter}
                onChange={(event) => setPaymentStatusFilter(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#0E0E10]/10 bg-white px-4 text-sm font-bold text-[#0E0E10] outline-none transition focus:border-[#FF6A3D]"
              >
                {paymentStatusOptions.map((status) => (
                  <option key={status} value={status}>{status === "all" ? "All statuses" : status}</option>
                ))}
              </select>
              <p className="mt-3 text-xs font-bold text-[#68707A]">Showing {filteredPayments.length} of {paymentRecords.length} Stripe payment records.</p>
            </div>
            <div className="mt-4 space-y-3">
              {filteredPayments.length ? (
                filteredPayments.slice(0, 12).map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3">
                    <p className="text-sm font-black text-[#0E0E10]">{money(payment.amount, payment.currencyCode)} · {payment.status}</p>
                    <p className="mt-1 text-xs font-bold text-[#68707A]">{payment.storeName}</p>
                    <p className="mt-1 text-xs font-semibold text-[#8B929C]">Paid: {formatDateTime(payment.paidAt)}</p>
                    {payment.billingPeriodMonth ? <p className="mt-0.5 text-[11px] font-semibold text-[#8B929C]">Billing period: {payment.billingPeriodMonth}</p> : null}
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#68707A]">No Stripe payment records match this view.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
