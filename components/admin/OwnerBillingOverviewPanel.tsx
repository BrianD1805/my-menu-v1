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

type OwnerClientView = "paid" | "trial" | "expired";

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

function daysUntil(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function revenueLine(totals: CurrencyTotal[]) {
  if (!totals.length) return "No paid Stripe records yet";
  return totals.map((item) => `${money(item.amount, item.currencyCode)} (${item.payments})`).join(" · ");
}

function normaliseSearch(value: string) {
  return value.trim().toLowerCase();
}

function isExpiredTrial(store: BillingStore) {
  const state = String(store.billingState || "").toLowerCase();
  const trialStatus = String(store.trialStatus || "").toLowerCase();
  const subscriptionStatus = String(store.subscriptionStatus || "").toLowerCase();
  const trialDays = daysUntil(store.trialEndsAt);
  return state === "expired" || trialStatus === "expired" || subscriptionStatus === "expired" || (state === "trial" && trialDays !== null && trialDays < 0);
}

function matchesOwnerView(store: BillingStore, view: OwnerClientView) {
  if (view === "paid") return store.billingState === "active";
  if (view === "trial") return store.billingState === "trial" && !isExpiredTrial(store);
  return isExpiredTrial(store) || store.billingState === "cancelled";
}

function matchesSearch(store: BillingStore, searchTerm: string) {
  const query = normaliseSearch(searchTerm);
  if (!query) return true;
  const haystack = [
    store.name,
    store.slug,
    store.planLabel,
    store.billingState,
    store.subscriptionStatus,
    store.trialStatus,
    store.lastPayment?.currencyCode,
    store.lastPayment?.status,
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

function viewTitle(view: OwnerClientView) {
  if (view === "paid") return "Paid clients";
  if (view === "trial") return "Clients on free trial";
  return "Trial expired";
}

function viewHelp(view: OwnerClientView) {
  if (view === "paid") return "Stores with active billing. Keep this list clean and easy to scan.";
  if (view === "trial") return "Stores still in their free trial. Follow up before the trial ends.";
  return "Stores where the trial has ended or billing access needs owner attention.";
}

function statusPillClasses(view: OwnerClientView) {
  if (view === "paid") return "border-[#339933]/35 bg-[#F0FFF4] text-[#0A5C2D]";
  if (view === "trial") return "border-[#336699]/35 bg-[#EAF3FB] text-[#28547D]";
  return "border-red-200 bg-red-50 text-red-900";
}

function statusTextFor(store: BillingStore, view: OwnerClientView) {
  const trialDays = daysUntil(store.trialEndsAt);
  if (view === "paid") return "Paid client";
  if (view === "trial") return trialDays === null ? "Free trial" : `${trialDays} day${trialDays === 1 ? "" : "s"} left`;
  return "Trial expired";
}

function detailCard(label: string, value: string) {
  return (
    <div className="rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8B929C]">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-[#111827]">{value}</p>
    </div>
  );
}

export default function OwnerBillingOverviewPanel() {
  const ownerAccess = useOwnerPlatformAccess();
  const [payload, setPayload] = useState<BillingOverviewPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState<OwnerClientView>("paid");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedStoreId, setExpandedStoreId] = useState<string | null>(null);
  const [ownerAssistBusyId, setOwnerAssistBusyId] = useState<string | null>(null);
  const canLoad = ownerAccess.unlocked && Boolean(ownerAccess.platformKey);

  const loadBillingOverview = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setMessage("Loading owner platform overview...");
    try {
      const response = await fetch("/api/platform/billing-overview", {
        cache: "no-store",
        headers: ownerAccess.platformHeaders,
      });
      const data = (await response.json().catch(() => ({}))) as BillingOverviewPayload;
      if (!response.ok) throw new Error(data?.error || "Could not load owner platform overview.");
      setPayload(data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load owner platform overview.");
    } finally {
      setLoading(false);
    }
  }, [canLoad, ownerAccess.platformHeaders]);

  useEffect(() => {
    void loadBillingOverview();
  }, [loadBillingOverview]);

  const data = payload || EMPTY_PAYLOAD;

  const paidStores = useMemo(() => data.stores.filter((store) => matchesOwnerView(store, "paid")), [data.stores]);
  const trialStores = useMemo(() => data.stores.filter((store) => matchesOwnerView(store, "trial")), [data.stores]);
  const expiredStores = useMemo(() => data.stores.filter((store) => matchesOwnerView(store, "expired")), [data.stores]);

  const activeStores = useMemo(
    () => data.stores.filter((store) => matchesOwnerView(store, activeView) && matchesSearch(store, searchTerm)),
    [data.stores, activeView, searchTerm],
  );

  useEffect(() => {
    setExpandedStoreId(null);
  }, [activeView, searchTerm]);

  const cards: Array<{ key: OwnerClientView; label: string; value: number; hint: string; classes: string }> = [
    { key: "paid", label: "Paid clients", value: paidStores.length, hint: "Active billing", classes: "border-[#336699]/35 bg-[#EAF3FB] text-[#28547D]" },
    { key: "trial", label: "Free trial", value: trialStores.length, hint: "Still deciding", classes: "border-[#336699]/35 bg-white text-[#28547D]" },
    { key: "expired", label: "Trial expired", value: expiredStores.length, hint: "Follow up", classes: "border-red-200 bg-red-50 text-red-900" },
  ];

  const paymentAttentionCount = data.summary.paymentAttention + data.summary.missingStripeLink;

  const exportCurrentView = useCallback(() => {
    downloadCsv(
      `orduva-owner-${activeView}-clients-${exportDateStamp()}.csv`,
      ["Store", "Slug", "Plan", "Billing state", "Subscription status", "Trial status", "Trial ends", "Last payment", "Last payment date", "Stripe linked"],
      activeStores.map((store) => [
        store.name,
        store.slug,
        store.planLabel,
        store.billingState,
        store.subscriptionStatus,
        store.trialStatus,
        store.trialEndsAt || "",
        store.lastPayment ? money(store.lastPayment.amount, store.lastPayment.currencyCode) : "",
        store.lastPayment?.paidAt || "",
        store.hasStripeLink ? "Yes" : "No",
      ]),
    );
  }, [activeStores, activeView]);

  const openOwnerAssistAdmin = useCallback(async (store: BillingStore) => {
    if (!store.id) return;
    setOwnerAssistBusyId(store.id);
    setMessage("Opening owner support access...");
    try {
      const response = await fetch("/api/platform/tenant-admin-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAccess.platformHeaders },
        body: JSON.stringify({ tenantId: store.id }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; tenant?: { name?: string; slug?: string } };
      if (!response.ok) throw new Error(data?.error || "Could not open tenant admin.");
      setMessage(`Owner support access ready for ${data?.tenant?.name || store.name}.`);
      window.open("/admin", "_blank", "noopener,noreferrer");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not open tenant admin.");
    } finally {
      setOwnerAssistBusyId(null);
    }
  }, [ownerAccess.platformHeaders]);

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#0E0E10]/10 bg-white shadow-[0_18px_50px_rgba(14,14,16,0.08)]">
      <div className="bg-gradient-to-br from-[#0E0E10] via-[#102338] to-[#336699] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#BFD8EE]">Owner platform</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Client status overview</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
              A simpler owner view. Start with the three important groups, then open one client row only when you need the account details.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadBillingOverview()}
              disabled={loading || !canLoad}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0E0E10] transition hover:bg-[#F3F7FA] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <button
              type="button"
              onClick={exportCurrentView}
              disabled={!activeStores.length}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export view
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-white/15 bg-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#BFD8EE]">Total stores</p>
            <p className="mt-2 text-3xl font-semibold leading-none text-white">{data.summary.totalStores}</p>
            <p className="mt-2 text-xs font-bold text-white/58">Across all owner platform records.</p>
          </div>
          <div className="rounded-[22px] border border-[#339933]/35 bg-[#339933]/14 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#DDFBE4]">Last 30 days</p>
            <p className="mt-2 text-xl font-semibold leading-tight text-white">{revenueLine(data.summary.last30DaysRevenue)}</p>
            <p className="mt-2 text-xs font-bold text-white/58">Recorded Stripe billing payments.</p>
          </div>
          <div className="rounded-[22px] border border-[#336699]/35 bg-white/10 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#BFD8EE]">Needs attention</p>
            <p className="mt-2 text-3xl font-semibold leading-none text-white">{paymentAttentionCount}</p>
            <p className="mt-2 text-xs font-bold text-white/58">Payment attention or missing Stripe links.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#0E0E10]/10 p-5 sm:p-6">
        {message ? (
          <p className="mb-4 rounded-2xl border border-[#336699]/20 bg-[#F3F7FA] px-4 py-3 text-sm font-bold text-[#336699]">{message}</p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          {cards.map((card) => {
            const selected = activeView === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setActiveView(card.key)}
                className={`rounded-[26px] border p-5 text-left transition hover:-translate-y-0.5 ${card.classes} ${selected ? "ring-2 ring-[#336699] ring-offset-2" : ""}`}
                aria-pressed={selected}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">{card.label}</p>
                <p className="mt-3 text-5xl font-semibold leading-none">{card.value}</p>
                <p className="mt-3 text-sm font-bold opacity-70">{card.hint}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-[28px] border border-[#0E0E10]/10 bg-[#F3F7FA] p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#336699]">Selected list</p>
              <h3 className="mt-1 text-2xl font-semibold text-[#0E0E10]">{viewTitle(activeView)}</h3>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#68707A]">{viewHelp(activeView)}</p>
            </div>
            <div className="rounded-2xl border border-[#0E0E10]/10 bg-white p-3 lg:min-w-[280px]">
              <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B929C]" htmlFor="owner-client-search">Search this list</label>
              <input
                id="owner-client-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Store, slug, plan or status"
                className="mt-2 min-h-11 w-full rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 text-sm font-bold text-[#0E0E10] outline-none transition focus:border-[#336699] focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-[#0E0E10]/10 bg-white">
            <div className="hidden grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr_0.35fr] gap-3 rounded-t-[22px] border-b border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B929C] lg:grid">
              <span>Store</span>
              <span>Status</span>
              <span>Plan</span>
              <span>{activeView === "paid" ? "Last payment" : "Trial ends"}</span>
              <span className="text-center">Open</span>
            </div>

            {activeStores.length ? (
              <div className="space-y-3 p-3">
                {activeStores.map((store) => {
                  const storeUrl = store.slug ? `https://${store.slug}.orduva.com` : "#";
                  const expanded = expandedStoreId === store.id;
                  return (
                    <article key={store.id} className="overflow-hidden rounded-[20px] border border-[#0E0E10]/10 bg-white text-sm shadow-[0_10px_28px_rgba(14,14,16,0.04)]">
                      <button
                        type="button"
                        onClick={() => setExpandedStoreId(expanded ? null : store.id)}
                        className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-[#F8FAFC] lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr_0.35fr] lg:items-center"
                        aria-expanded={expanded}
                      >
                        <div>
                          <p className="font-semibold text-[#0E0E10]">{store.name}</p>
                          <p className="mt-1 text-xs font-bold text-[#336699]">{store.slug ? `${store.slug}.orduva.com` : "No slug"}</p>
                        </div>
                        <div>
                          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${statusPillClasses(activeView)}`}>
                            {statusTextFor(store, activeView)}
                          </span>
                        </div>
                        <p className="font-bold text-[#505862]">{store.planLabel}</p>
                        <p className="font-bold text-[#505862]">
                          {activeView === "paid"
                            ? store.lastPayment
                              ? `${money(store.lastPayment.amount, store.lastPayment.currencyCode)} · ${formatDate(store.lastPayment.paidAt)}`
                              : "No payment recorded"
                            : formatDate(store.trialEndsAt)}
                        </p>
                        <span className="mx-auto inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-3 text-xs font-semibold text-[#336699] shadow-sm transition hover:border-[#336699]/40 hover:bg-[#EAF3FB]" aria-label={expanded ? "Close details" : "Open details"}>
                          {expanded ? "Close" : "Details"}
                        </span>
                      </button>

                      {expanded ? (
                        <div className="border-t border-[#0E0E10]/8 bg-[#FBFCFD] px-4 py-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B929C]">Account information</p>
                              <h4 className="mt-1 text-lg font-semibold text-[#0E0E10]">{store.name}</h4>
                              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#68707A]">
                                Owner-only billing and access details. Checklist progress is kept out of this view so the client list stays focused.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {store.slug ? (
                                <a
                                  href={storeUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-xs font-semibold text-[#111827] transition hover:border-[#336699]/35 hover:bg-[#EAF3FB]"
                                  title="Open storefront"
                                >
                                  Store ↗
                                </a>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => void openOwnerAssistAdmin(store)}
                                disabled={ownerAssistBusyId === store.id}
                                className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#336699] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#28547D] disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {ownerAssistBusyId === store.id ? "Opening..." : "Open admin as owner"}
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {detailCard("Tenant ID", store.id)}
                            {detailCard("Created", formatDateTime(store.createdAt))}
                            {detailCard("Billing state", store.billingState || "Not recorded")}
                            {detailCard("Billing provider", store.billingProvider || "Not recorded")}
                            {detailCard("Subscription", store.subscriptionStatus || "Not recorded")}
                            {detailCard("Trial status", store.trialStatus || "Not recorded")}
                            {detailCard("Trial ends", formatDateTime(store.trialEndsAt))}
                            {detailCard("Plan", store.planLabel || "Not recorded")}
                            {detailCard("Stripe customer", store.stripeCustomerId || "Not linked")}
                            {detailCard("Stripe subscription", store.stripeSubscriptionId || "Not linked")}
                            {detailCard("Last payment", store.lastPayment ? money(store.lastPayment.amount, store.lastPayment.currencyCode) : "Not recorded")}
                            {detailCard("Last payment date", formatDateTime(store.lastPayment?.paidAt))}
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm font-bold text-[#68707A]">No stores match this view.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
