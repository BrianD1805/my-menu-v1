"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";

type ReadinessCheck = {
  key: string;
  label: string;
  ready: boolean;
  important: boolean;
  detail: string | null;
};
type TrialState = {
  trialStatus: string;
  subscriptionStatus: string;
  planName: string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysTotal: number;
  trialDaysRemaining: number | null;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  isSubscriptionActive?: boolean;
  checkoutBlocked?: boolean;
};
type StoreReadiness = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string | null;
  trial: TrialState;
  storeAddress: string;
  storefrontUrl: string;
  adminLoginUrl: string;
  readiness: {
    score: number;
    label: string;
    tone: string;
    readyCount: number;
    totalChecks: number;
    blockingIssues: number;
  };
  counts: {
    categories: number;
    products: number;
    activeProducts: number;
    productPhotos: number;
    adminPushDevices: number;
    orders: number;
    emailSent: number;
    emailFailed: number;
  };
  referral?: {
    referredBy?: {
      referrerName: string;
      referrerType: string;
      referralCode: string;
      refSource: string | null;
      status: string;
      rewardRatePercent: number | null;
    } | null;
    stats?: {
      referredCount: number;
      trialCount: number;
      rewardRatePercent: number | null;
      referralCode: string | null;
    };
  };
  checks: ReadinessCheck[];
};
type Summary = {
  totalStores: number;
  readyStores: number;
  nearlyReadyStores: number;
  needsSetupStores: number;
  missingProducts: number;
  missingAdminPush: number;
  payingClients: number;
  trialActiveStores: number;
  trialExpiringStores: number;
  trialExpiredStores: number;
  checkoutPausedStores: number;
  referralSignups: number;
  storesWithReferrals: number;
  referredStores: number;
};
type Payload = { stores: StoreReadiness[]; summary: Summary };
type DashboardFilter =
  | "all"
  | "paying"
  | "trials"
  | "expiring"
  | "expired"
  | "paused"
  | "needsSetup"
  | "referrals";

const EMPTY_SUMMARY: Summary = {
  totalStores: 0,
  readyStores: 0,
  nearlyReadyStores: 0,
  needsSetupStores: 0,
  missingProducts: 0,
  missingAdminPush: 0,
  payingClients: 0,
  trialActiveStores: 0,
  trialExpiringStores: 0,
  trialExpiredStores: 0,
  checkoutPausedStores: 0,
  referralSignups: 0,
  storesWithReferrals: 0,
  referredStores: 0,
};

function toneClasses(tone: string) {
  if (tone === "ready")
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  if (tone === "attention")
    return "bg-[#EAF3FB] text-[#28547D] ring-1 ring-[#8FB6D9]";
  return "bg-red-50 text-red-800 ring-1 ring-red-200";
}

function trialPillClasses(trial: TrialState) {
  if (
    trial.subscriptionStatus === "active" ||
    trial.trialStatus === "converted" ||
    trial.isSubscriptionActive
  )
    return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  if (trial.isTrialExpired || trial.checkoutBlocked)
    return "bg-red-50 text-red-800 ring-1 ring-red-200";
  if ((trial.trialDaysRemaining ?? 99) <= 2)
    return "bg-[#F3F7FA] text-[#28547D] ring-1 ring-[#336699]/25";
  return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
}
function trialLabel(trial: TrialState) {
  if (
    trial.subscriptionStatus === "active" ||
    trial.trialStatus === "converted" ||
    trial.isSubscriptionActive
  )
    return "Paying client";
  if (trial.isTrialExpired || trial.checkoutBlocked) return "Trial expired";
  if (trial.trialDaysRemaining === null) return "Trial active";
  if (trial.trialDaysRemaining === 1) return "1 trial day left";
  return `${trial.trialDaysRemaining} trial days left`;
}

function checkClasses(ready: boolean, important: boolean) {
  if (ready) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (important) return "border-red-200 bg-red-50 text-red-900";
  return "border-[#8FB6D9] bg-[#EAF3FB] text-[#28547D]";
}
function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function storeMatchesFilter(store: StoreReadiness, filter: DashboardFilter) {
  if (filter === "all") return true;
  if (filter === "paying")
    return (
      store.trial.isSubscriptionActive ||
      store.trial.subscriptionStatus === "active" ||
      store.trial.trialStatus === "converted"
    );
  if (filter === "trials") return store.trial.isTrialActive;
  if (filter === "expiring")
    return (
      store.trial.isTrialActive && (store.trial.trialDaysRemaining ?? 99) <= 2
    );
  if (filter === "expired") return store.trial.isTrialExpired;
  if (filter === "paused")
    return Boolean(store.trial.checkoutBlocked || store.trial.isTrialExpired);
  if (filter === "needsSetup") return store.readiness.label === "Needs setup";
  if (filter === "referrals")
    return (
      Boolean(store.referral?.referredBy) ||
      (store.referral?.stats?.referredCount || 0) > 0
    );
  return true;
}

function filterTitle(filter: DashboardFilter) {
  if (filter === "paying") return "Paying clients";
  if (filter === "trials") return "Active trials";
  if (filter === "expiring") return "Trials expiring soon";
  if (filter === "expired") return "Expired trials";
  if (filter === "paused") return "Checkout paused stores";
  if (filter === "needsSetup") return "Stores needing setup";
  if (filter === "referrals") return "Referral activity";
  return "All stores";
}

export default function OwnerStoreReadinessPanel() {
  const ownerAccess = useOwnerPlatformAccess();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [extendBusyId, setExtendBusyId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");
  const [selectedDeleteIds, setSelectedDeleteIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const canLoad = ownerAccess.unlocked && Boolean(ownerAccess.platformKey);

  const loadReadiness = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setMessage("Loading store dashboard...");
    try {
      const response = await fetch("/api/platform/store-readiness", {
        cache: "no-store",
        headers: ownerAccess.platformHeaders,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data?.error || "Could not load store dashboard.");
      setPayload(data as Payload);
      setSelectedDeleteIds((current) =>
        current.filter((id) =>
          (data as Payload).stores.some((store) => store.id === id),
        ),
      );
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load store dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [canLoad, ownerAccess.platformHeaders]);

  useEffect(() => {
    loadReadiness();
  }, [loadReadiness]);

  async function extendTrial(tenantId: string, additionalDays = 7) {
    if (!ownerAccess.platformKey) return;
    setExtendBusyId(tenantId);
    setMessage(
      `Adding ${additionalDays} trial day${additionalDays === 1 ? "" : "s"}...`,
    );
    try {
      const response = await fetch("/api/platform/trials/extend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...ownerAccess.platformHeaders,
        },
        body: JSON.stringify({ tenantId, additionalDays }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data?.error || "Could not extend trial.");
      setMessage(
        `Trial extended by ${additionalDays} day${additionalDays === 1 ? "" : "s"}.`,
      );
      await loadReadiness();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not extend trial.",
      );
    } finally {
      setExtendBusyId(null);
    }
  }
  function toggleDeleteSelection(tenantId: string) {
    setSelectedDeleteIds((current) =>
      current.includes(tenantId)
        ? current.filter((id) => id !== tenantId)
        : [...current, tenantId],
    );
  }

  function clearDeleteSelection() {
    setSelectedDeleteIds([]);
    setDeleteDialogOpen(false);
    setDeleteConfirmation("");
  }

  async function deleteSelectedStores() {
    if (!selectedDeleteIds.length) return;
    setDeleteBusy(true);
    setMessage("Deleting selected stores...");
    try {
      const response = await fetch("/api/platform/stores/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...ownerAccess.platformHeaders,
        },
        body: JSON.stringify({
          tenantIds: selectedDeleteIds,
          confirmation: deleteConfirmation,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(data?.error || "Could not delete selected stores.");
      const deletedCount = Array.isArray(data?.deletedStores)
        ? data.deletedStores.length
        : selectedDeleteIds.length;
      setMessage(
        `${deletedCount} store${deletedCount === 1 ? "" : "s"} deleted. Related orders, customers, referral records and store setup data were removed.`,
      );
      clearDeleteSelection();
      await loadReadiness();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete selected stores.",
      );
    } finally {
      setDeleteBusy(false);
    }
  }

  const stores = payload?.stores || [];
  const summary = payload?.summary || EMPTY_SUMMARY;
  const filteredStores = useMemo(
    () => stores.filter((store) => storeMatchesFilter(store, activeFilter)),
    [stores, activeFilter],
  );
  const selectedCount = filteredStores.length;
  const selectedDeleteStores = useMemo(
    () => stores.filter((store) => selectedDeleteIds.includes(store.id)),
    [stores, selectedDeleteIds],
  );
  const deleteConfirmationReady = deleteConfirmation.trim() === "DELETE ALL";
  const summaryCards = [
    {
      key: "all" as const,
      label: "Stores",
      value: summary.totalStores,
      hint: "All onboarded stores",
      className: "border-white/10 bg-white/10 text-white",
    },
    {
      key: "paying" as const,
      label: "Paying clients",
      value: summary.payingClients,
      hint: "Active subscriptions",
      className: "border-emerald-300/30 bg-emerald-400/10 text-emerald-50",
    },
    {
      key: "trials" as const,
      label: "Trials",
      value: summary.trialActiveStores,
      hint: "Currently active",
      className: "border-[#8FB6D9]/35 bg-[#8FB6D9]/10 text-[#BFD8EE]",
    },
    {
      key: "expiring" as const,
      label: "Expiring soon",
      value: summary.trialExpiringStores,
      hint: "2 days or less",
      className: "border-[#8FB6D9]/35 bg-[#336699]/10 text-[#EAF3FB]",
    },
    {
      key: "expired" as const,
      label: "Expired trials",
      value: summary.trialExpiredStores,
      hint: "Needs attention",
      className: "border-red-300/30 bg-red-400/10 text-red-50",
    },
    {
      key: "paused" as const,
      label: "Checkout paused",
      value: summary.checkoutPausedStores,
      hint: "Customer checkout blocked",
      className: "border-red-300/30 bg-red-500/10 text-red-50",
    },
    {
      key: "needsSetup" as const,
      label: "Needs setup",
      value: summary.needsSetupStores,
      hint: "Missing key setup",
      className: "border-slate-300/20 bg-slate-400/10 text-slate-50",
    },
    {
      key: "referrals" as const,
      label: "Referrals",
      value: summary.referralSignups,
      hint: "Tenant-sourced signups",
      className: "border-[#8FB6D9]/35 bg-white/10 text-[#BFD8EE]",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#0E0E10]/10 bg-white shadow-[0_18px_50px_rgba(14,14,16,0.08)]">
      <div className="bg-gradient-to-br from-[#0E0E10] via-[#1B1B1F] to-[#332019] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8FB6D9]">
              Owner dashboard
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Store overview
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
              A simpler top-level view for all stores. Click a card to show only
              the matching stores below.
            </p>
          </div>
          <button
            type="button"
            onClick={loadReadiness}
            disabled={loading || !canLoad}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0E0E10] transition hover:bg-[#F3F7FA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh dashboard"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const selected = activeFilter === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => {
                  setActiveFilter(card.key);
                  setExpandedId(null);
                }}
                className={[
                  "group rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB6D9]",
                  card.className,
                  selected
                    ? "ring-2 ring-[#8FB6D9] ring-offset-2 ring-offset-[#0E0E10]"
                    : "",
                ].join(" ")}
                aria-pressed={selected}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-75">
                  {card.label}
                </p>
                <p className="mt-2 text-3xl font-semibold leading-none">
                  {card.value}
                </p>
                <p className="mt-2 text-xs font-bold opacity-70">{card.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#0E0E10]/10 p-5 sm:p-6">
        {message ? (
          <p className="mb-4 rounded-2xl border border-[#336699]/20 bg-[#F3F7FA] px-4 py-3 text-sm font-bold text-[#28547D]">
            {message}
          </p>
        ) : null}
        <div className="mb-4 flex flex-col gap-3 rounded-[24px] border border-[#0E0E10]/8 bg-[#F3F7FA] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#28547D]">
              Selected view
            </p>
            <h3 className="mt-1 text-xl font-semibold text-[#0E0E10]">
              {filterTitle(activeFilter)}
            </h3>
            <p className="mt-1 text-sm font-semibold text-[#68707A]">
              Showing {selectedCount} of {summary.totalStores} stores. Detailed
              readiness checks are still available, but tucked away until you
              open a store.
            </p>
          </div>
          {activeFilter !== "all" ? (
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-xs font-semibold text-[#0E0E10] transition hover:bg-[#F3F7FA]"
            >
              Show all stores
            </button>
          ) : null}
        </div>

        <div className="mb-4 rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                Owner cleanup
              </p>
              <p className="mt-1 font-bold">
                Select stores with the checkbox on each card, then use bulk
                delete. No delete buttons are shown on individual tenant panels.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={!selectedDeleteIds.length}
                className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-red-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Delete selected ({selectedDeleteIds.length})
              </button>
              {selectedDeleteIds.length ? (
                <button
                  type="button"
                  onClick={clearDeleteSelection}
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-50"
                >
                  Clear selection
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {!loading && stores.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#0E0E10]/18 bg-[#F3F7FA] p-5 text-sm leading-6 text-[#5C5F66]">
            No stores are loaded yet. Create a store from public onboarding,
            then refresh this panel.
          </div>
        ) : null}
        {!loading && stores.length > 0 && filteredStores.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#0E0E10]/18 bg-white p-5 text-sm leading-6 text-[#5C5F66]">
            No stores match this card yet.
          </div>
        ) : null}

        <div className="space-y-4">
          {filteredStores.map((store) => {
            const expanded = expandedId === store.id;
            return (
              <article
                key={store.id}
                className={[
                  "rounded-[26px] border bg-[#FDFBF8] p-4 transition",
                  selectedDeleteIds.includes(store.id)
                    ? "border-red-300 ring-2 ring-red-200"
                    : "border-[#0E0E10]/10",
                ].join(" ")}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <label
                      className="mt-1 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white shadow-sm transition hover:bg-[#F3F7FA]"
                      title={`Select ${store.name} for bulk deletion`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDeleteIds.includes(store.id)}
                        onChange={() => toggleDeleteSelection(store.id)}
                        className="h-5 w-5 accent-red-700"
                        aria-label={`Select ${store.name} for bulk deletion`}
                      />
                    </label>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-[#0E0E10]">
                          {store.name}
                        </h3>
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                            toneClasses(store.readiness.tone),
                          ].join(" ")}
                        >
                          {store.readiness.label}
                        </span>
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                            trialPillClasses(store.trial),
                          ].join(" ")}
                        >
                          {trialLabel(store.trial)}
                        </span>
                        {store.trial.checkoutBlocked ||
                        store.trial.isTrialExpired ? (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-800 ring-1 ring-red-200">
                            Checkout paused
                          </span>
                        ) : null}
                        {(store.referral?.stats?.referredCount || 0) > 0 ? (
                          <span className="rounded-full bg-[#F3F7FA] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#28547D] ring-1 ring-[#336699]/25">
                            {store.referral?.stats?.referredCount} referral
                            {store.referral?.stats?.referredCount === 1
                              ? ""
                              : "s"}
                          </span>
                        ) : null}
                        {store.referral?.referredBy ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-800 ring-1 ring-blue-200">
                            Referred
                          </span>
                        ) : null}
                      </div>
                      <a
                        href={store.storefrontUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block break-all text-sm font-bold text-[#28547D] hover:text-[#0E0E10]"
                      >
                        {store.storeAddress}
                      </a>
                      <p className="mt-1 text-xs font-semibold text-[#68707A]">
                        {store.readiness.readyCount} of{" "}
                        {store.readiness.totalChecks} checks complete ·{" "}
                        {store.readiness.blockingIssues} key issue(s) · Ends{" "}
                        {formatDate(store.trial.trialEndsAt)}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-[160px]">
                    <div className="h-3 overflow-hidden rounded-full bg-[#0E0E10]/10">
                      <div
                        className="h-full rounded-full bg-[#336699]"
                        style={{
                          width: `${Math.max(4, Math.min(100, store.readiness.score))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-right text-xs font-semibold text-[#0E0E10]">
                      {store.readiness.score}% ready
                    </p>
                  </div>
                </div>
                {store.referral?.referredBy ||
                (store.referral?.stats?.referredCount || 0) > 0 ? (
                  <div className="mt-4 grid gap-2 rounded-2xl border border-[#336699]/15 bg-white px-3 py-3 text-xs leading-5 text-[#5C5F66] sm:grid-cols-2">
                    {store.referral?.referredBy ? (
                      <p>
                        <span className="font-semibold text-[#0E0E10]">
                          Referred by:
                        </span>{" "}
                        {store.referral.referredBy.referrerName} ·{" "}
                        {store.referral.referredBy.rewardRatePercent || 15}%
                        reward-ready
                      </p>
                    ) : (
                      <p>
                        <span className="font-semibold text-[#0E0E10]">
                          Referral code:
                        </span>{" "}
                        {store.referral?.stats?.referralCode ||
                          `tenant_${store.slug}`}
                      </p>
                    )}
                    {(store.referral?.stats?.referredCount || 0) > 0 ? (
                      <p>
                        <span className="font-semibold text-[#0E0E10]">
                          Referrals made:
                        </span>{" "}
                        {store.referral?.stats?.referredCount} signup
                        {store.referral?.stats?.referredCount === 1 ? "" : "s"}{" "}
                        captured ·{" "}
                        {store.referral?.stats?.rewardRatePercent || 15}% future
                        reward rate
                      </p>
                    ) : (
                      <p>
                        <span className="font-semibold text-[#0E0E10]">
                          Referral source:
                        </span>{" "}
                        {store.referral?.referredBy?.refSource ||
                          "storefront/footer link"}
                      </p>
                    )}
                  </div>
                ) : null}
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {store.checks.slice(0, 5).map((check) => (
                    <div
                      key={check.key}
                      className={[
                        "rounded-2xl border px-3 py-2 text-xs font-bold",
                        checkClasses(check.ready, check.important),
                      ].join(" ")}
                    >
                      {check.ready ? "✓" : check.important ? "!" : "•"}{" "}
                      {check.label}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <a
                    href={store.storefrontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-xs font-semibold text-[#0E0E10] transition hover:bg-[#F3F7FA]"
                  >
                    Open storefront
                  </a>
                  <a
                    href={store.adminLoginUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#0E0E10] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#252528]"
                  >
                    Open admin login
                  </a>
                  <button
                    type="button"
                    onClick={() => void extendTrial(store.id, 7)}
                    disabled={extendBusyId === store.id}
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#336699]/25 bg-[#F3F7FA] px-4 py-2 text-xs font-semibold text-[#28547D] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {extendBusyId === store.id
                      ? "Adding days..."
                      : "+7 trial days"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void extendTrial(store.id, 1)}
                    disabled={extendBusyId === store.id}
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-xs font-semibold text-[#0E0E10] transition hover:bg-[#F3F7FA] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    +1 day
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : store.id)}
                    className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-xs font-semibold text-[#0E0E10] transition hover:bg-[#F3F7FA]"
                  >
                    {expanded ? "Hide full checklist" : "Full checklist"}
                  </button>
                </div>
                {expanded ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {store.checks.map((check) => (
                      <div
                        key={check.key}
                        className={[
                          "rounded-2xl border p-4 text-sm",
                          checkClasses(check.ready, check.important),
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{check.label}</p>
                            <p className="mt-1 text-xs font-semibold opacity-80">
                              {check.detail || "No detail recorded"}
                            </p>
                          </div>
                          <span className="text-lg font-semibold">
                            {check.ready ? "✓" : check.important ? "!" : "•"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>

      {deleteDialogOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0E0E10]/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-[32px] border border-red-200 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
            <div className="bg-red-700 px-5 py-5 text-white sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-100">
                Danger zone
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight">
                Delete selected stores?
              </h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-red-50">
                This will remove the selected tenants and their related database
                records, including orders, customers, products, settings, admin
                users, referrals and reward/credit records.
              </p>
            </div>
            <div className="max-h-[58vh] overflow-y-auto px-5 py-5 sm:px-6">
              <p className="text-sm font-semibold text-[#0E0E10]">
                Stores selected for deletion:
              </p>
              <div className="mt-3 space-y-2">
                {selectedDeleteStores.map((store) => (
                  <div
                    key={store.id}
                    className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3"
                  >
                    <p className="font-semibold text-red-950">{store.name}</p>
                    <p className="mt-1 break-all text-xs font-bold text-red-800">
                      {store.storeAddress} · {store.counts.orders} order(s) ·{" "}
                      {store.counts.products} product(s)
                    </p>
                  </div>
                ))}
              </div>
              <label className="mt-5 block text-sm font-semibold text-[#0E0E10]">
                Type DELETE ALL in capitals to confirm
                <input
                  value={deleteConfirmation}
                  onChange={(event) =>
                    setDeleteConfirmation(event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border border-[#0E0E10]/12 bg-white px-4 py-3 text-sm font-semibold tracking-[0.08em] text-[#0E0E10] outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100"
                  placeholder="DELETE ALL"
                />
              </label>
              <p className="mt-3 text-xs font-semibold leading-5 text-[#68707A]">
                This is permanent. Use it mainly for test stores or stores that
                have genuinely been closed.
              </p>
            </div>
            <div className="flex flex-col gap-2 border-t border-[#0E0E10]/10 bg-[#F3F7FA] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeleteConfirmation("");
                }}
                disabled={deleteBusy}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-semibold text-[#0E0E10] transition hover:bg-[#EAF3FB] disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteSelectedStores()}
                disabled={deleteBusy || !deleteConfirmationReady}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {deleteBusy
                  ? "Deleting..."
                  : `Delete ${selectedDeleteIds.length} store${selectedDeleteIds.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
