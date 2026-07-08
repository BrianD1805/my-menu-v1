"use client";

import { useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";
import { CUSTOM_DOMAIN_ADDON_MONTHLY, customDomainStripePriceEnvKey } from "@/lib/custom-domain-addon";
import { formatPlanPrice, getPricingCurrency, type PricingCurrencyCode } from "@/lib/pricing";

type DomainRow = {
  id: string;
  tenant_id: string;
  domain_name: string;
  normalized_domain: string;
  status: string;
  billing_status: string;
  addon_price_currency: string;
  addon_price_monthly: number;
  billing_interval: string;
  requested_by_email: string | null;
  tenant_notes: string | null;
  owner_notes: string | null;
  dns_target: string | null;
  verification_token: string | null;
  approved_at: string | null;
  activated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  tenants?: { name?: string | null; slug?: string | null } | null;
};

const STATUS_OPTIONS = ["requested", "billing_pending", "pending_dns", "pending_owner_review", "approved", "active", "rejected", "disabled"];
const BILLING_OPTIONS = ["not_started", "addon_pending", "active", "past_due", "cancelled", "manual"];
const CURRENCIES: PricingCurrencyCode[] = ["USD", "ZAR", "KES", "GBP", "EUR"];

function label(value: string) {
  return String(value || "").replace(/_/g, " ");
}

function money(amount: number, currencyCode: string) {
  const currency = getPricingCurrency(currencyCode);
  return formatPlanPrice(amount, currency.code, { forceDecimals: currency.decimalPlaces > 0 });
}

function tone(value: string) {
  const clean = String(value || "").toLowerCase();
  if (clean === "active" || clean === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (clean === "rejected" || clean === "disabled" || clean === "cancelled") return "border-red-200 bg-red-50 text-red-800";
  if (clean.includes("pending") || clean === "requested") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function OwnerCustomDomainsPanel() {
  const { platformHeaders } = useOwnerPlatformAccess();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("open");
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/platform/custom-domains", { headers: platformHeaders, cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Could not load custom domains.");
      const list = (payload?.domains || []) as DomainRow[];
      setDomains(list);
      setNotes(Object.fromEntries(list.map((item) => [item.id, item.owner_notes || ""])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load custom domains.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformHeaders["x-orduva-platform-key"], platformHeaders["x-orduva-platform-2fa-session"]]);

  const visible = useMemo(() => {
    if (filter === "all") return domains;
    if (filter === "active") return domains.filter((domain) => domain.status === "active");
    return domains.filter((domain) => !["active", "rejected", "disabled"].includes(domain.status));
  }, [domains, filter]);

  async function updateDomain(id: string, values: Record<string, unknown>) {
    setSavingId(id);
    setError("");
    try {
      const response = await fetch("/api/platform/custom-domains", {
        method: "PATCH",
        headers: { ...platformHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...values }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Could not update custom domain.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update custom domain.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_54px_rgba(14,14,16,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#336699]">Custom domains</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0E0E10]">Domain add-on requests</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5C5F66]">
              Custom domains are a paid add-on. Keep activation manual while Orduva is using Netlify aliases, then approve once billing and DNS are ready.
            </p>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#252528] disabled:cursor-wait disabled:opacity-60">
            {loading ? "Checking…" : "Refresh"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {CURRENCIES.map((code) => (
            <div key={code} className="rounded-2xl border border-[#0E0E10]/10 bg-[#F3F7FA] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5C5F66]">{code}</p>
              <p className="mt-1 text-xl font-semibold text-[#0E0E10]">{money(CUSTOM_DOMAIN_ADDON_MONTHLY[code], code)} / month</p>
              <code className="mt-2 block overflow-x-auto rounded-xl border border-[#0E0E10]/10 bg-white px-2 py-1 text-[10px] font-bold text-[#373A3F]">{customDomainStripePriceEnvKey(code)}</code>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["open", "active", "all"].map((value) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${filter === value ? "bg-[#336699] text-white" : "border border-[#0E0E10]/10 bg-white text-[#5C5F66]"}`}>{value}</button>
          ))}
        </div>
        {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</p> : null}
      </div>

      {!loading && !visible.length ? <p className="rounded-[28px] border border-dashed border-[#0E0E10]/15 bg-white p-6 text-sm font-bold text-[#5C5F66]">No custom domain requests in this view.</p> : null}

      <div className="grid gap-4">
        {visible.map((domain) => (
          <article key={domain.id} className="overflow-hidden rounded-[30px] border border-[#0E0E10]/10 bg-white shadow-[0_14px_44px_rgba(14,14,16,0.07)]">
            <header className="border-b border-[#0E0E10]/10 bg-[#F3F7FA] px-5 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="break-all text-xl font-semibold text-[#0E0E10]">{domain.domain_name}</p>
                  <p className="mt-1 text-sm font-bold text-[#5C5F66]">{domain.tenants?.name || "Store"} · {domain.tenants?.slug || domain.tenant_id}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${tone(domain.status)}`}>{label(domain.status)}</span>
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${tone(domain.billing_status)}`}>{label(domain.billing_status)}</span>
                </div>
              </div>
            </header>
            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr]">
              <div className="grid gap-3 text-sm">
                <p><strong>Price:</strong> {money(Number(domain.addon_price_monthly || 0), domain.addon_price_currency || "USD")} / month</p>
                <p><strong>DNS target:</strong> {domain.dns_target || "orduva.com"}</p>
                <p className="break-all"><strong>Verification token:</strong> {domain.verification_token || "Not generated"}</p>
                <p><strong>Requested by:</strong> {domain.requested_by_email || "Unknown"}</p>
                {domain.tenant_notes ? <p className="rounded-2xl border border-[#0E0E10]/10 bg-[#F3F7FA] px-3 py-2"><strong>Store note:</strong> {domain.tenant_notes}</p> : null}
              </div>
              <div className="grid gap-3">
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">Domain status
                  <select value={domain.status} onChange={(event) => updateDomain(domain.id, { status: event.target.value })} className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]">
                    {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">Add-on billing
                  <select value={domain.billing_status} onChange={(event) => updateDomain(domain.id, { billingStatus: event.target.value })} className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]">
                    {BILLING_OPTIONS.map((value) => <option key={value} value={value}>{label(value)}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">Owner notes
                  <textarea value={notes[domain.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [domain.id]: event.target.value }))} className="min-h-24 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#0E0E10]" placeholder="DNS, Netlify alias, billing and approval notes." />
                </label>
                <button type="button" onClick={() => updateDomain(domain.id, { ownerNotes: notes[domain.id] || "" })} disabled={savingId === domain.id} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white transition hover:bg-[#252528] disabled:cursor-wait disabled:opacity-60">
                  {savingId === domain.id ? "Saving…" : "Save owner notes"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
