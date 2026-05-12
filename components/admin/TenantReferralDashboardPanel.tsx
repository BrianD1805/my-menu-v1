"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CurrencyTotals = Record<string, number>;

type DashboardPayload = {
  tenant: { id: string; name: string | null; slug: string; currencyCode: string; currencySymbol: string | null };
  links: { tenantReferralCode: string; tenantReferralUrl: string; affiliateApplicationUrl: string };
  source: { status: string | null; reward_rate_percent: number | null } | null;
  signups: Array<{
    id: string;
    referralCode: string | null;
    status: string | null;
    refSource: string | null;
    createdAt: string | null;
    rewardRatePercent: number | null;
    referredStore: { id: string; name: string | null; slug: string | null; subscriptionStatus: string | null; trialStatus: string | null } | null;
  }>;
  affiliateSignups: Array<{
    id: string;
    referralCode: string | null;
    status: string | null;
    refSource: string | null;
    createdAt: string | null;
    tenantRewardRatePercent: number | null;
    referredStore: { id: string; name: string | null; slug: string | null; subscriptionStatus: string | null; trialStatus: string | null } | null;
  }>;
  applications: Array<{ id: string; applicant_name: string | null; email: string | null; payout_currency_code: string | null; earning_region: string | null; status: string | null; created_at: string | null }>;
  partners: Array<{ id: string; display_name: string | null; email: string | null; tracking_code: string | null; status: string | null; tenant_reward_rate_percent: number | null; created_at: string | null; shareUrl: string | null }>;
  summaries: {
    tenantReferral: { signupCount: number; trialCount: number; activeRewardCount: number; rewardRatePercent: number; estimatedByCurrency: CurrencyTotals; pendingByCurrency: CurrencyTotals; paidByCurrency: CurrencyTotals };
    affiliateIntroductions: { applicationCount: number; pendingApplicationCount: number; approvedPartnerCount: number; tenantRewardRatePercent: number; estimatedByCurrency: CurrencyTotals; pendingByCurrency: CurrencyTotals; paidByCurrency: CurrencyTotals };
  };
};

function dateLabel(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function money(amount: unknown, currency = "GBP") {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function totalsLabel(totals: CurrencyTotals | null | undefined, fallbackCurrency = "GBP") {
  const entries = Object.entries(totals || {}).filter(([, amount]) => Number(amount || 0) > 0);
  if (!entries.length) return money(0, fallbackCurrency);
  return entries.map(([currency, amount]) => money(amount, currency)).join(" · ");
}

function statusLabel(value: string | null | undefined) {
  const clean = String(value || "trial").replace(/_/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function StatCard({ label, value, hint, tone = "white" }: { label: string; value: string | number; hint: string; tone?: "dark" | "orange" | "green" | "white" | "blue" }) {
  const toneClass = {
    dark: "border-white/10 bg-[#0E0E10] text-white",
    orange: "border-[#FF6A3D]/20 bg-[#FFF7F0] text-[#9A3412]",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
    white: "border-[#0E0E10]/10 bg-white text-[#0E0E10]",
  }[tone];
  return (
    <div className={`rounded-[26px] border p-5 shadow-[0_18px_45px_rgba(14,14,16,0.08)] ${toneClass}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-75">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs font-bold leading-5 opacity-75">{hint}</p>
    </div>
  );
}

function CopyLinkCard({ title, eyebrow, body, link, copied, onCopy }: { title: string; eyebrow: string; body: string; link: string; copied: boolean; onCopy: () => void }) {
  return (
    <article className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_20px_55px_rgba(14,14,16,0.08)] sm:p-6">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#C84F2A]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0E0E10]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5C5F66]">{body}</p>
      <div className="mt-4 rounded-2xl border border-[#FF6A3D]/20 bg-[#FFF7F0] px-4 py-3 text-sm font-bold leading-6 text-[#9A3412]">
        <p className="break-all">{link}</p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className="admin-pressable mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(14,14,16,0.18)] transition hover:-translate-y-[1px] hover:bg-[#252528]"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </article>
  );
}

export default function TenantReferralDashboardPanel() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [message, setMessage] = useState("Loading tenant referral dashboard...");
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<"tenant" | "affiliate" | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setMessage("Loading tenant referral dashboard...");
    try {
      const response = await fetch("/api/admin/referrals", { cache: "no-store", credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not load tenant referral dashboard.");
      setPayload(data as DashboardPayload);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load tenant referral dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const mixedCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    for (const totals of [payload?.summaries.tenantReferral.estimatedByCurrency, payload?.summaries.affiliateIntroductions.estimatedByCurrency, payload?.summaries.tenantReferral.pendingByCurrency, payload?.summaries.affiliateIntroductions.pendingByCurrency]) {
      for (const currency of Object.keys(totals || {})) currencies.add(currency);
    }
    return Array.from(currencies).filter((currency) => currency !== (payload?.tenant.currencyCode || "GBP"));
  }, [payload]);

  async function copyLink(key: "tenant" | "affiliate", value?: string) {
    if (!value || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1600);
  }

  if (loading && !payload) {
    return (
      <section className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-6 text-center shadow-[0_24px_70px_rgba(14,14,16,0.12)]">
        <p className="text-sm font-bold text-[#5C5F66]">{message}</p>
      </section>
    );
  }

  if (!payload) {
    return (
      <section className="rounded-[30px] border border-red-200 bg-red-50 p-6 shadow-[0_18px_45px_rgba(14,14,16,0.08)]">
        <p className="text-sm font-bold leading-6 text-red-900">{message || "Could not load tenant referral dashboard."}</p>
        <button type="button" onClick={() => void loadDashboard()} className="admin-pressable mt-4 rounded-2xl bg-red-900 px-5 py-3 text-sm font-black text-white">Try again</button>
      </section>
    );
  }

  const tenantSummary = payload.summaries.tenantReferral;
  const affiliateSummary = payload.summaries.affiliateIntroductions;
  const currency = payload.tenant.currencyCode || "GBP";

  return (
    <section className="space-y-6">
      <div className="rounded-[34px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_28px_80px_rgba(14,14,16,0.11)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF6A3D]">Tenant rewards</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0E0E10] sm:text-3xl">Referral dashboard</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5C5F66]">
              Share your tenant referral link with other businesses, or introduce people who want to become Orduva affiliates. Tenant referrals and approved affiliate introductions are tracked separately.
            </p>
          </div>
          <button type="button" onClick={() => void loadDashboard()} className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-white">
            Refresh
          </button>
        </div>
        {message ? <p className="mt-4 rounded-2xl border border-[#FF6A3D]/25 bg-[#FFF7F0] px-4 py-3 text-sm font-bold text-[#9A3412]">{message}</p> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CopyLinkCard
          eyebrow="Tenant referral link"
          title="Refer another business"
          body={`You receive ${tenantSummary.rewardRatePercent || 15}% monthly commission on paid Orduva subscription sales captured through this tenant link.`}
          link={payload.links.tenantReferralUrl}
          copied={copiedKey === "tenant"}
          onCopy={() => void copyLink("tenant", payload.links.tenantReferralUrl)}
        />
        <CopyLinkCard
          eyebrow="Affiliate introduction link"
          title="Invite an affiliate applicant"
          body={`If this applicant is approved and their referrals become paid Orduva clients, you receive ${affiliateSummary.tenantRewardRatePercent || 5}% monthly commission from those paid sales.`}
          link={payload.links.affiliateApplicationUrl}
          copied={copiedKey === "affiliate"}
          onCopy={() => void copyLink("affiliate", payload.links.affiliateApplicationUrl)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tenant signups" value={tenantSummary.signupCount} hint="Stores captured from your tenant referral link." tone="dark" />
        <StatCard label="Tenant estimate" value={totalsLabel(tenantSummary.estimatedByCurrency, currency)} hint="Estimated monthly tenant referral reward." tone="orange" />
        <StatCard label="Affiliate applicants" value={affiliateSummary.applicationCount} hint={`${affiliateSummary.pendingApplicationCount} pending owner approval.`} tone="blue" />
        <StatCard label="Affiliate tenant share" value={totalsLabel(affiliateSummary.estimatedByCurrency, currency)} hint="Your 5% tenant share from introduced approved affiliates." tone="green" />
      </div>

      {mixedCurrencies.length ? (
        <p className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold leading-6 text-orange-900">
          Some reward records are in {mixedCurrencies.join(", ")}. These may need manual conversion to {currency} until automatic FX conversion is added.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_50px_rgba(14,14,16,0.08)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#C84F2A]">Tenant referral activity</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-[#0E0E10]">Referred stores</h3>
            </div>
            <p className="rounded-full border border-[#0E0E10]/10 bg-[#F8FAFC] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#5C5F66]">{tenantSummary.rewardRatePercent || 15}% rate</p>
          </div>
          <div className="mt-5 space-y-3">
            {payload.signups.map((signup) => (
              <article key={signup.id} className="rounded-[22px] border border-[#0E0E10]/10 bg-[#FFFDF8] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-black text-[#0E0E10]">{signup.referredStore?.name || signup.referredStore?.slug || "Store pending"}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#68707A]">{statusLabel(signup.status)} · {dateLabel(signup.createdAt)}</p>
                  </div>
                  <p className="w-fit rounded-full bg-[#FFF7F0] px-3 py-1.5 text-xs font-black text-[#9A3412]">{signup.rewardRatePercent || tenantSummary.rewardRatePercent || 15}%</p>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-[#5C5F66]">Code {signup.referralCode || payload.links.tenantReferralCode} · Source {signup.refSource || "tenant link"}</p>
              </article>
            ))}
            {!payload.signups.length ? <p className="rounded-2xl border border-dashed border-[#0E0E10]/15 bg-[#F8FAFC] px-4 py-4 text-sm font-bold text-[#5C5F66]">No tenant referral signups have been captured yet.</p> : null}
          </div>
        </section>

        <section className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_50px_rgba(14,14,16,0.08)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#C84F2A]">Affiliate introductions</p>
              <h3 className="mt-1 text-2xl font-black tracking-tight text-[#0E0E10]">Applicants and partners</h3>
            </div>
            <p className="rounded-full border border-[#0E0E10]/10 bg-[#F8FAFC] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#5C5F66]">{affiliateSummary.tenantRewardRatePercent || 5}% tenant share</p>
          </div>
          <div className="mt-5 space-y-3">
            {payload.applications.slice(0, 8).map((application) => (
              <article key={application.id} className="rounded-[22px] border border-[#0E0E10]/10 bg-[#F8FAFC] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-black text-[#0E0E10]">{application.applicant_name || application.email || "Affiliate applicant"}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#68707A]">{statusLabel(application.status)} · {dateLabel(application.created_at)}</p>
                  </div>
                  <p className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#0E0E10]">{application.payout_currency_code || "GBP"}</p>
                </div>
                {application.earning_region ? <p className="mt-3 text-xs font-semibold leading-5 text-[#5C5F66]">Target earning region: {application.earning_region}</p> : null}
              </article>
            ))}
            {payload.affiliateSignups.slice(0, 8).map((signup) => (
              <article key={`affiliate-signup-${signup.id}`} className="rounded-[22px] border border-amber-200 bg-[#FFFDF8] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-black text-[#0E0E10]">{signup.referredStore?.name || signup.referredStore?.slug || "Store pending"}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#68707A]">{statusLabel(signup.status)} · {dateLabel(signup.createdAt)}</p>
                  </div>
                  <p className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#9A3412]">{signup.tenantRewardRatePercent || affiliateSummary.tenantRewardRatePercent || 5}% tenant share</p>
                </div>
                <p className="mt-3 text-xs font-semibold leading-5 text-[#5C5F66]">Store referred by an approved affiliate you introduced · Code {signup.referralCode || "affiliate link"} · Source {signup.refSource || "affiliate_partner"}</p>
              </article>
            ))}
            {payload.partners.slice(0, 8).map((partner) => (
              <article key={partner.id} className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-black text-emerald-950">{partner.display_name || partner.email || "Approved affiliate"}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">{statusLabel(partner.status)} · {dateLabel(partner.created_at)}</p>
                  </div>
                  <p className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-900">{partner.tenant_reward_rate_percent || affiliateSummary.tenantRewardRatePercent || 5}%</p>
                </div>
                {partner.tracking_code ? <p className="mt-3 break-all text-xs font-semibold leading-5 text-emerald-900">Affiliate code: {partner.tracking_code}</p> : null}
              </article>
            ))}
            {!payload.applications.length && !payload.partners.length && !payload.affiliateSignups.length ? <p className="rounded-2xl border border-dashed border-[#0E0E10]/15 bg-[#F8FAFC] px-4 py-4 text-sm font-bold text-[#5C5F66]">No affiliate applicants or affiliate-led stores have been introduced from this tenant yet.</p> : null}
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[26px] border border-[#0E0E10]/10 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#68707A]">Tenant credits</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#5C5F66]">Pending: <span className="text-[#0E0E10]">{totalsLabel(tenantSummary.pendingByCurrency, currency)}</span></p>
          <p className="mt-1 text-sm font-bold leading-6 text-[#5C5F66]">Paid: <span className="text-[#0E0E10]">{totalsLabel(tenantSummary.paidByCurrency, currency)}</span></p>
        </div>
        <div className="rounded-[26px] border border-[#0E0E10]/10 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#68707A]">Affiliate introduction credits</p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#5C5F66]">Pending: <span className="text-[#0E0E10]">{totalsLabel(affiliateSummary.pendingByCurrency, currency)}</span></p>
          <p className="mt-1 text-sm font-bold leading-6 text-[#5C5F66]">Paid: <span className="text-[#0E0E10]">{totalsLabel(affiliateSummary.paidByCurrency, currency)}</span></p>
        </div>
      </div>
    </section>
  );
}
