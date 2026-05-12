"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";

type TenantRef = { id: string; name: string | null; slug: string | null; subscription_status?: string | null; trial_status?: string | null } | null;
type ReferralReward = {
  id: string;
  affiliate_id?: string | null;
  referrer_type?: string | null;
  secondary_referrer_tenant_id?: string | null;
  reward_rate_percent: number | null;
  monthly_subscription_amount: number | null;
  estimated_monthly_reward: number | null;
  secondary_reward_rate_percent?: number | null;
  secondary_estimated_monthly_reward?: number | null;
  currency_code: string | null;
  reward_status: string | null;
  notes: string | null;
};
type ReferralCredit = {
  id: string;
  affiliate_id?: string | null;
  paid_month: string | null;
  subscription_amount: number | null;
  reward_rate_percent: number | null;
  reward_amount: number | null;
  secondary_reward_rate_percent?: number | null;
  secondary_reward_amount?: number | null;
  currency_code: string | null;
  credit_status: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string | null;
};
type SubscriptionPayment = {
  id: string;
  billing_period_month: string | null;
  subscription_amount: number | null;
  currency_code: string | null;
  payment_source: string | null;
  payment_status: string | null;
  payment_reference: string | null;
  notes: string | null;
  created_at: string | null;
};
type ReferralRow = {
  signup: { id: string; status: string | null; referral_code: string | null; ref_source: string | null; created_at: string | null };
  source: { id: string; referral_code: string | null; display_name: string | null; referrer_type: string | null; reward_rate_percent: number | null; status: string | null } | null;
  reward: ReferralReward | null;
  referrerTenant: TenantRef;
  secondaryReferrerTenant?: TenantRef;
  referredTenant: TenantRef;
  credits: ReferralCredit[];
  payments?: SubscriptionPayment[];
  totals: { creditsCount: number; paymentsCount?: number; pendingCredits: number; paidCredits: number; pendingAmount: number; paidAmount: number; secondaryPendingAmount?: number; secondaryPaidAmount?: number; subscriptionPaymentsAmount?: number };
};
type ReferralPayload = {
  rows: ReferralRow[];
  summary: {
    totalReferrals: number;
    trialRewards: number;
    activeRewards: number;
    pausedRewards: number;
    cancelledRewards: number;
    estimatedMonthlyLiability: number;
    totalPendingCredits: number;
    totalPaidCredits: number;
    totalSubscriptionPayments?: number;
    uniqueReferrers?: number;
    uniqueReferredStores?: number;
    totalsByCurrency?: Record<string, { estimatedMonthlyLiability: number; pendingCredits: number; paidCredits: number; subscriptionPayments: number }>;
  };
};
type DraftState = Record<string, {
  rewardRatePercent: string;
  tenantIntroductionSharePercent: string;
  monthlySubscriptionAmount: string;
  currencyCode: string;
  rewardStatus: string;
  notes: string;
  creditMonth: string;
  paymentReference: string;
}>;

type FilterKey = "all" | "trial" | "active" | "paused" | "cancelled" | "pending" | "paid";

const EMPTY_SUMMARY = {
  totalReferrals: 0,
  trialRewards: 0,
  activeRewards: 0,
  pausedRewards: 0,
  cancelledRewards: 0,
  estimatedMonthlyLiability: 0,
  totalPendingCredits: 0,
  totalPaidCredits: 0,
  totalSubscriptionPayments: 0,
  uniqueReferrers: 0,
  uniqueReferredStores: 0,
  totalsByCurrency: {},
};

function monthInputValue(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function money(value: unknown, currency = "GBP") {
  const amount = Number(value || 0);
  const cleanCurrency = String(currency || "GBP").toUpperCase();
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: cleanCurrency }).format(amount);
  } catch {
    return `${cleanCurrency} ${amount.toFixed(2)}`;
  }
}

function moneyByCurrency(
  totalsByCurrency: ReferralPayload["summary"]["totalsByCurrency"] | undefined,
  field: "estimatedMonthlyLiability" | "pendingCredits" | "paidCredits" | "subscriptionPayments",
  fallbackValue = 0,
) {
  const entries = Object.entries(totalsByCurrency || {})
    .map(([currency, totals]) => ({ currency, amount: Number(totals?.[field] || 0) }))
    .filter((entry) => entry.amount > 0);

  if (!entries.length) return money(fallbackValue);

  return entries
    .sort((a, b) => a.currency.localeCompare(b.currency))
    .map((entry) => money(entry.amount, entry.currency))
    .join(" · ");
}

function dateLabel(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function monthLabel(value: string | null) {
  if (!value) return "Month not set";
  const date = new Date(`${value.slice(0, 7)}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function statusClasses(status: string | null | undefined) {
  const clean = String(status || "trial").toLowerCase();
  if (clean === "active") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (clean === "paused") return "bg-orange-50 text-orange-800 ring-orange-200";
  if (clean === "cancelled") return "bg-red-50 text-red-800 ring-red-200";
  return "bg-[#FFF7F0] text-[#9A3412] ring-[#FF6A3D]/25";
}

function creditClasses(status: string | null | undefined) {
  const clean = String(status || "pending").toLowerCase();
  if (clean === "paid") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (clean === "credited") return "bg-blue-50 text-blue-800 ring-blue-200";
  if (clean === "void") return "bg-slate-100 text-slate-700 ring-slate-200";
  return "bg-orange-50 text-orange-800 ring-orange-200";
}

function filterTitle(filter: FilterKey) {
  if (filter === "trial") return "Trial referrals";
  if (filter === "active") return "Active monthly rewards";
  if (filter === "paused") return "Paused rewards";
  if (filter === "cancelled") return "Cancelled rewards";
  if (filter === "pending") return "Pending credits";
  if (filter === "paid") return "Paid credits";
  return "All referrals";
}

function rowMatches(row: ReferralRow, filter: FilterKey) {
  const status = String(row.reward?.reward_status || "trial").toLowerCase();
  if (filter === "all") return true;
  if (filter === "pending") return row.totals.pendingCredits > 0 || row.totals.pendingAmount > 0;
  if (filter === "paid") return row.totals.paidCredits > 0 || row.totals.paidAmount > 0;
  return status === filter;
}

export default function OwnerReferralRewardsPanel() {
  const ownerAccess = useOwnerPlatformAccess();
  const [payload, setPayload] = useState<ReferralPayload | null>(null);
  const [drafts, setDrafts] = useState<DraftState>({});
  const [filter, setFilter] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const canLoad = ownerAccess.unlocked && Boolean(ownerAccess.platformKey);

  const loadReferrals = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setMessage("Loading referrals...");
    try {
      const response = await fetch("/api/platform/referrals", { cache: "no-store", headers: ownerAccess.platformHeaders });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not load referral rewards.");
      const nextPayload = data as ReferralPayload;
      setPayload(nextPayload);
      const nextDrafts: DraftState = {};
      for (const row of nextPayload.rows || []) {
        if (!row.reward?.id) continue;
        nextDrafts[row.reward.id] = {
          rewardRatePercent: String(row.reward.reward_rate_percent ?? row.source?.reward_rate_percent ?? 15),
          tenantIntroductionSharePercent: String(row.reward.secondary_reward_rate_percent ?? (row.reward.secondary_referrer_tenant_id ? 5 : "")),
          monthlySubscriptionAmount: String(row.reward.monthly_subscription_amount ?? ""),
          currencyCode: String(row.reward.currency_code || "GBP"),
          rewardStatus: String(row.reward.reward_status || "trial"),
          notes: row.reward.notes || "",
          creditMonth: monthInputValue(),
          paymentReference: "",
        };
      }
      setDrafts(nextDrafts);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load referral rewards.");
    } finally {
      setLoading(false);
    }
  }, [canLoad, ownerAccess.platformHeaders]);

  useEffect(() => { void loadReferrals(); }, [loadReferrals]);

  const rows = payload?.rows || [];
  const summary = payload?.summary || EMPTY_SUMMARY;
  const filteredRows = useMemo(() => rows.filter((row) => rowMatches(row, filter)), [rows, filter]);
  const referralGroups = useMemo(() => {
    const groups = new Map<string, { key: string; name: string; rows: ReferralRow[]; activeRewards: number; pendingAmount: number; paidAmount: number }>();
    for (const row of filteredRows) {
      const key = row.referrerTenant?.id || row.source?.id || row.signup.referral_code || row.signup.id;
      const name = row.referrerTenant?.name || row.source?.display_name || row.signup.referral_code || "Referral source";
      const current = groups.get(key) || { key, name, rows: [], activeRewards: 0, pendingAmount: 0, paidAmount: 0 };
      current.rows.push(row);
      if (row.reward?.reward_status === "active") current.activeRewards += 1;
      current.pendingAmount += Number(row.totals.pendingAmount || 0);
      current.paidAmount += Number(row.totals.paidAmount || 0);
      groups.set(key, current);
    }
    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredRows]);
  const cards = [
    { key: "all" as const, label: "Referring tenants", value: summary.uniqueReferrers || 0, hint: `${summary.totalReferrals || 0} total referral records`, className: "border-white/10 bg-white/10 text-white" },
    { key: "all" as const, label: "Referred stores", value: summary.uniqueReferredStores || 0, hint: "Stores captured from referral links", className: "border-white/10 bg-white/10 text-white" },
    { key: "active" as const, label: "Active rewards", value: summary.activeRewards, hint: "Monthly credits switched on", className: "border-emerald-300/30 bg-emerald-400/10 text-emerald-50" },
    { key: "active" as const, label: "Monthly liability", value: moneyByCurrency(summary.totalsByCurrency, "estimatedMonthlyLiability", summary.estimatedMonthlyLiability), hint: "Estimated active rewards", className: "border-[#FFB168]/35 bg-[#FFB168]/10 text-[#FFE1C7]" },
    { key: "pending" as const, label: "Pending credits", value: moneyByCurrency(summary.totalsByCurrency, "pendingCredits", summary.totalPendingCredits), hint: "Credited but unpaid", className: "border-orange-300/35 bg-orange-400/10 text-orange-50" },
    { key: "paid" as const, label: "Paid credits", value: moneyByCurrency(summary.totalsByCurrency, "paidCredits", summary.totalPaidCredits), hint: "Credits already marked paid", className: "border-blue-300/30 bg-blue-400/10 text-blue-50" },
    { key: "trial" as const, label: "Trial", value: summary.trialRewards, hint: "Not paying yet", className: "border-[#FFB168]/35 bg-[#FFB168]/10 text-[#FFE1C7]" },
    { key: "paused" as const, label: "Paused", value: summary.pausedRewards, hint: "Not crediting now", className: "border-slate-300/20 bg-slate-400/10 text-slate-50" },
    { key: "cancelled" as const, label: "Cancelled", value: summary.cancelledRewards, hint: "Stopped rewards", className: "border-red-300/30 bg-red-500/10 text-red-50" },
  ];

  function updateDraft(rewardId: string, key: keyof DraftState[string], value: string) {
    setDrafts((current) => ({ ...current, [rewardId]: { ...current[rewardId], [key]: value } }));
  }

  async function saveReward(row: ReferralRow) {
    if (!row.reward?.id) return;
    const draft = drafts[row.reward.id];
    setBusyId(row.reward.id);
    setMessage("Saving reward settings...");
    try {
      const response = await fetch("/api/platform/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...ownerAccess.platformHeaders },
        body: JSON.stringify({ rewardId: row.reward.id, ...draft }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not save referral reward.");
      setMessage("Referral reward settings saved.");
      await loadReferrals();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save referral reward.");
    } finally {
      setBusyId(null);
    }
  }

  async function recordSubscriptionPayment(row: ReferralRow) {
    if (!row.reward?.id) return;
    const draft = drafts[row.reward.id];
    setBusyId(`${row.reward.id}:payment`);
    setMessage("Recording subscription payment and creating referral credit...");
    try {
      const response = await fetch("/api/platform/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAccess.platformHeaders },
        body: JSON.stringify({
          action: "record_subscription_payment",
          rewardId: row.reward.id,
          subscriptionAmount: draft.monthlySubscriptionAmount,
          rewardRatePercent: draft.rewardRatePercent,
          secondaryRewardRatePercent: draft.tenantIntroductionSharePercent,
          currencyCode: draft.currencyCode,
          paidMonth: `${draft.creditMonth || monthInputValue()}-01`,
          creditStatus: "pending",
          paymentSource: "manual",
          paymentStatus: "paid",
          paymentReference: draft.paymentReference,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not record subscription payment.");
      setMessage("Subscription payment recorded and referral credit created.");
      await loadReferrals();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not record subscription payment.");
    } finally {
      setBusyId(null);
    }
  }

  async function markCredit(creditId: string, creditStatus: string) {
    setBusyId(creditId);
    setMessage("Updating credit...");
    try {
      const response = await fetch("/api/platform/referrals/credits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...ownerAccess.platformHeaders },
        body: JSON.stringify({ creditId, creditStatus }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not update credit.");
      setMessage("Credit updated.");
      await loadReferrals();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update credit.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#0E0E10]/10 bg-white shadow-[0_18px_50px_rgba(14,14,16,0.08)]">
      <div className="bg-gradient-to-br from-[#0E0E10] via-[#1B1B1F] to-[#332019] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFB168]">Referral rewards</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Monthly tenant credits</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">
              Track who referred whom, set the reward percentage, record each monthly subscription payment, and automatically create the tenant credit from that payment.
            </p>
          </div>
          <button type="button" onClick={() => void loadReferrals()} disabled={loading || !canLoad} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-[#FFF7F0] disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? "Refreshing..." : "Refresh referrals"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const selected = filter === card.key;
            return (
              <button key={`${card.label}-${card.key}`} type="button" onClick={() => setFilter(card.key)} className={["rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB168]", card.className, selected ? "ring-2 ring-[#FFB168] ring-offset-2 ring-offset-[#0E0E10]" : ""].join(" ")}>
                <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-75">{card.label}</p>
                <p className="mt-2 text-2xl font-black leading-none">{card.value}</p>
                <p className="mt-2 text-xs font-bold opacity-70">{card.hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#0E0E10]/10 p-5 sm:p-6">
        {message ? <p className="mb-4 rounded-2xl border border-[#FF6A3D]/20 bg-[#FFF7F0] px-4 py-3 text-sm font-bold text-[#C84F2A]">{message}</p> : null}

        <div className="mb-4 rounded-[24px] border border-[#0E0E10]/8 bg-[#FFF7F0] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Selected view</p>
          <h3 className="mt-1 text-xl font-black text-[#0E0E10]">{filterTitle(filter)}</h3>
          <p className="mt-1 text-sm font-semibold text-[#68707A]">
            Showing <span className="font-black text-[#0E0E10]">{filteredRows.length}</span> referral records across <span className="font-black text-[#0E0E10]">{referralGroups.length}</span> referring tenants.
          </p>
          <p className="mt-1 text-sm font-semibold text-[#68707A]">
            Estimated active monthly reward liability: <span className="font-black text-[#0E0E10]">{moneyByCurrency(summary.totalsByCurrency, "estimatedMonthlyLiability", summary.estimatedMonthlyLiability)}</span> · Recorded subscription payments: <span className="font-black text-[#0E0E10]">{moneyByCurrency(summary.totalsByCurrency, "subscriptionPayments", summary.totalSubscriptionPayments || 0)}</span> · Pending credits: <span className="font-black text-[#0E0E10]">{moneyByCurrency(summary.totalsByCurrency, "pendingCredits", summary.totalPendingCredits)}</span> · Paid credits: <span className="font-black text-[#0E0E10]">{moneyByCurrency(summary.totalsByCurrency, "paidCredits", summary.totalPaidCredits)}</span>
          </p>
        </div>

        {!loading && rows.length === 0 ? <div className="rounded-[24px] border border-dashed border-[#0E0E10]/18 bg-[#FFF7F0] p-5 text-sm leading-6 text-[#5C5F66]">No referral signups have been captured yet.</div> : null}
        {!loading && rows.length > 0 && filteredRows.length === 0 ? <div className="rounded-[24px] border border-dashed border-[#0E0E10]/18 bg-white p-5 text-sm leading-6 text-[#5C5F66]">No referrals match this card yet.</div> : null}

        <div className="space-y-4">
          {filteredRows.map((row) => {
            const rewardId = row.reward?.id || "";
            const draft = rewardId ? drafts[rewardId] : null;
            const currency = draft?.currencyCode || row.reward?.currency_code || "GBP";
            const isAffiliateReferral = row.source?.referrer_type === "public_affiliate" || Boolean(row.reward?.affiliate_id);
            const referrerName = row.referrerTenant?.name || row.source?.display_name || row.signup.referral_code || "Referral source";
            const referredName = row.referredTenant?.name || row.referredTenant?.slug || "Referred store";
            const secondaryTenantName = row.secondaryReferrerTenant?.name || row.secondaryReferrerTenant?.slug || "Referring tenant";
            return (
              <article key={row.signup.id} className="rounded-[26px] border border-[#0E0E10]/10 bg-[#FDFBF8] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-[#0E0E10]">{referrerName}</h3>
                      <span className={["rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ring-1", statusClasses(row.reward?.reward_status)].join(" ")}>{row.reward?.reward_status || "trial"}</span>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#5C5F66] ring-1 ring-[#0E0E10]/10">{row.reward?.reward_rate_percent ?? row.source?.reward_rate_percent ?? 15}% monthly</span>
                    </div>
                    <p className="mt-1 text-sm font-black uppercase tracking-[0.14em] text-[#C84F2A]">{isAffiliateReferral ? "Approved affiliate" : "Referring tenant"}</p>
                    <p className="mt-2 text-sm font-bold text-[#0E0E10]">Referred store: <span className="text-[#C84F2A]">{referredName}</span></p>
                    <p className="mt-1 text-xs font-semibold text-[#68707A]">
                      Code {row.signup.referral_code || row.source?.referral_code || "not recorded"} · Source {row.signup.ref_source || "storefront footer"} · Captured {dateLabel(row.signup.created_at)}
                    </p>
                    {isAffiliateReferral && row.reward?.secondary_reward_rate_percent ? (
                      <p className="mt-2 rounded-2xl border border-[#FF6A3D]/20 bg-[#FFF7F0] px-3 py-2 text-xs font-bold text-[#9A3412]">
                        Affiliate earns {row.reward.reward_rate_percent ?? 10}% monthly. Tenant introduction share is {row.reward.secondary_reward_rate_percent ?? 5}% and goes to {secondaryTenantName}.
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3 text-sm text-right">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#68707A]">Estimated monthly credit</p>
                    <p className="mt-1 text-2xl font-black text-[#0E0E10]">{money(row.reward?.estimated_monthly_reward, currency)}</p>
                    {isAffiliateReferral && row.reward?.secondary_referrer_tenant_id ? (
                      <p className="mt-1 text-xs font-black text-[#9A3412]">Tenant intro estimate {money(row.reward?.secondary_estimated_monthly_reward || 0, currency)}</p>
                    ) : null}
                    <p className="mt-1 text-xs font-bold text-[#68707A]">Payments {money(row.totals.subscriptionPaymentsAmount || 0, currency)} · Pending {money(row.totals.pendingAmount, currency)} · Paid {money(row.totals.paidAmount, currency)}</p>
                    {isAffiliateReferral && (row.totals.secondaryPendingAmount || row.totals.secondaryPaidAmount) ? (
                      <p className="mt-1 text-xs font-bold text-[#9A3412]">Tenant share pending {money(row.totals.secondaryPendingAmount || 0, currency)} · paid {money(row.totals.secondaryPaidAmount || 0, currency)}</p>
                    ) : null}
                  </div>
                </div>

                {draft && row.reward ? (
                  <div className="mt-4 grid gap-3 rounded-[22px] border border-[#0E0E10]/8 bg-white p-4 lg:grid-cols-7">
                    <label className="block lg:col-span-1"><span className="mb-1 block text-xs font-black text-[#0E0E10]">Affiliate %</span><input value={draft.rewardRatePercent} onChange={(event) => updateDraft(row.reward!.id, "rewardRatePercent", event.target.value)} inputMode="decimal" className="min-h-11 w-full rounded-2xl border border-[#0E0E10]/12 px-3 py-2 text-sm font-bold outline-none focus:border-[#FF6A3D]" /></label>
                    {isAffiliateReferral && row.reward.secondary_referrer_tenant_id ? (
                      <label className="block lg:col-span-1"><span className="mb-1 block text-xs font-black text-[#0E0E10]">Tenant intro %</span><input value={draft.tenantIntroductionSharePercent} onChange={(event) => updateDraft(row.reward!.id, "tenantIntroductionSharePercent", event.target.value)} inputMode="decimal" placeholder="5" className="min-h-11 w-full rounded-2xl border border-[#0E0E10]/12 px-3 py-2 text-sm font-bold outline-none focus:border-[#FF6A3D]" /></label>
                    ) : null}
                    <label className="block lg:col-span-1"><span className="mb-1 block text-xs font-black text-[#0E0E10]">Monthly fee</span><input value={draft.monthlySubscriptionAmount} onChange={(event) => updateDraft(row.reward!.id, "monthlySubscriptionAmount", event.target.value)} inputMode="decimal" placeholder="29.00" className="min-h-11 w-full rounded-2xl border border-[#0E0E10]/12 px-3 py-2 text-sm font-bold outline-none focus:border-[#FF6A3D]" /></label>
                    <label className="block lg:col-span-1"><span className="mb-1 block text-xs font-black text-[#0E0E10]">Currency</span><input value={draft.currencyCode} onChange={(event) => updateDraft(row.reward!.id, "currencyCode", event.target.value.toUpperCase().slice(0, 3))} className="min-h-11 w-full rounded-2xl border border-[#0E0E10]/12 px-3 py-2 text-sm font-bold uppercase outline-none focus:border-[#FF6A3D]" /></label>
                    <label className="block lg:col-span-1"><span className="mb-1 block text-xs font-black text-[#0E0E10]">Status</span><select value={draft.rewardStatus} onChange={(event) => updateDraft(row.reward!.id, "rewardStatus", event.target.value)} className="min-h-11 w-full rounded-2xl border border-[#0E0E10]/12 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-[#FF6A3D]"><option value="trial">Trial</option><option value="active">Active</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option></select></label>
                    <label className="block lg:col-span-2"><span className="mb-1 block text-xs font-black text-[#0E0E10]">Notes</span><input value={draft.notes} onChange={(event) => updateDraft(row.reward!.id, "notes", event.target.value)} placeholder="Internal note" className="min-h-11 w-full rounded-2xl border border-[#0E0E10]/12 px-3 py-2 text-sm font-bold outline-none focus:border-[#FF6A3D]" /></label>
                    <div className="flex flex-col gap-2 lg:col-span-7 sm:flex-row sm:flex-wrap">
                      <button type="button" onClick={() => void saveReward(row)} disabled={busyId === row.reward.id} className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#0E0E10] px-4 py-2 text-xs font-black text-white transition hover:bg-[#252528] disabled:cursor-not-allowed disabled:opacity-60">{busyId === row.reward.id ? "Saving..." : "Save reward settings"}</button>
                      <label className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-[#0E0E10]/10 bg-[#FFF7F0] px-3 py-2 text-xs font-black text-[#0E0E10]">Paid month <input type="month" value={draft.creditMonth} onChange={(event) => updateDraft(row.reward!.id, "creditMonth", event.target.value)} className="bg-transparent font-black outline-none" /></label>
                      <input value={draft.paymentReference} onChange={(event) => updateDraft(row.reward!.id, "paymentReference", event.target.value)} placeholder="Payment reference / note" className="min-h-10 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#FF6A3D]" />
                      <button type="button" onClick={() => void recordSubscriptionPayment(row)} disabled={busyId === `${row.reward.id}:payment`} className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#FF6A3D]/25 bg-[#FFF7F0] px-4 py-2 text-xs font-black text-[#9A3412] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">{busyId === `${row.reward.id}:payment` ? "Recording..." : "Record subscription payment"}</button>
                    </div>
                  </div>
                ) : <p className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-orange-800">Reward row is being prepared. Refresh this page in a moment.</p>}

                {row.payments && row.payments.length ? (
                  <div className="mt-4 rounded-[22px] border border-[#0E0E10]/8 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Subscription payment events</p>
                    <div className="mt-3 space-y-2">
                      {row.payments.slice(0, 6).map((payment) => (
                        <div key={payment.id} className="flex flex-col gap-2 rounded-2xl border border-[#0E0E10]/8 bg-[#FDFBF8] px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-black text-[#0E0E10]">{monthLabel(payment.billing_period_month)} · {money(payment.subscription_amount, payment.currency_code || currency)}</p>
                            <p className="text-xs font-semibold text-[#68707A]">{payment.payment_source || "manual"} · {payment.payment_reference || "No reference"}</p>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-emerald-800 ring-1 ring-emerald-200">{payment.payment_status || "paid"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {row.credits.length ? (
                  <div className="mt-4 rounded-[22px] border border-[#0E0E10]/8 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Monthly credit ledger</p>
                    <div className="mt-3 space-y-2">
                      {row.credits.slice(0, 8).map((credit) => (
                        <div key={credit.id} className="flex flex-col gap-2 rounded-2xl border border-[#0E0E10]/8 bg-[#FDFBF8] px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-black text-[#0E0E10]">{monthLabel(credit.paid_month)} · {money(credit.reward_amount, credit.currency_code || currency)}</p>
                            <p className="text-xs font-semibold text-[#68707A]">Subscription {money(credit.subscription_amount, credit.currency_code || currency)} · {credit.reward_rate_percent || 15}% · {credit.payment_reference || "No reference"}</p>
                            {credit.secondary_reward_amount ? <p className="text-xs font-bold text-[#9A3412]">Tenant introduction share: {money(credit.secondary_reward_amount, credit.currency_code || currency)} at {credit.secondary_reward_rate_percent || 5}%</p> : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={["rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ring-1", creditClasses(credit.credit_status)].join(" ")}>{credit.credit_status || "pending"}</span>
                            {credit.credit_status !== "paid" ? <button type="button" onClick={() => void markCredit(credit.id, "paid")} disabled={busyId === credit.id} className="rounded-xl bg-[#0E0E10] px-3 py-2 text-xs font-black text-white">Mark paid</button> : null}
                            {credit.credit_status !== "void" ? <button type="button" onClick={() => void markCredit(credit.id, "void")} disabled={busyId === credit.id} className="rounded-xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-xs font-black text-[#0E0E10]">Void</button> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
