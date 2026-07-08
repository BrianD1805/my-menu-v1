"use client";

import { useEffect, useMemo, useState } from "react";
import { CUSTOM_DOMAIN_ADDON_MONTHLY, customDomainAddonPrice, normaliseCustomDomain, type CustomDomainBillingStatus, type CustomDomainStatus } from "@/lib/custom-domain-addon";
import { formatPlanPrice, getPricingCurrency, type PricingCurrencyCode } from "@/lib/pricing";

type DomainRow = {
  id: string;
  domain_name: string;
  normalized_domain: string;
  status: CustomDomainStatus;
  billing_status: CustomDomainBillingStatus;
  addon_price_currency: string;
  addon_price_monthly: number;
  requested_by_email: string | null;
  tenant_notes: string | null;
  owner_notes: string | null;
  dns_target: string | null;
  verification_token: string | null;
  approved_at?: string | null;
  activated_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const CURRENCY_ORDER: PricingCurrencyCode[] = ["USD", "ZAR", "KES", "GBP", "EUR"];

function statusLabel(status: string) {
  return String(status || "requested").replace(/_/g, " ");
}

function statusClass(status: string) {
  const clean = String(status || "").toLowerCase();
  if (clean === "active" || clean === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (clean === "rejected" || clean === "disabled") return "border-red-200 bg-red-50 text-red-800";
  if (clean.includes("pending")) return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function money(amount: number, currencyCode: string) {
  const currency = getPricingCurrency(currencyCode);
  return formatPlanPrice(amount, currency.code, { forceDecimals: currency.decimalPlaces > 0 });
}

export default function CustomDomainSettingsPanel({ currencyCode }: { currencyCode: string }) {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [dnsTarget, setDnsTarget] = useState("orduva.com");
  const [domainName, setDomainName] = useState("");
  const [tenantNotes, setTenantNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedPrice = useMemo(() => customDomainAddonPrice(currencyCode), [currencyCode]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/custom-domains?currency=${encodeURIComponent(selectedPrice.currencyCode)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Could not load custom domain requests.");
      setDomains(payload?.domains || []);
      setDnsTarget(payload?.dnsTarget || "orduva.com");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load custom domain requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrice.currencyCode]);

  async function requestDomain() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const cleanDomain = normaliseCustomDomain(domainName);
      const response = await fetch("/api/admin/custom-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainName: cleanDomain, tenantNotes, currencyCode: selectedPrice.currencyCode }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Could not submit the custom domain request.");
      setDomainName("");
      setTenantNotes("");
      setMessage("Custom domain request saved. Orduva must approve the add-on and DNS before the domain goes live.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the custom domain request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-[24px] border border-[#336699]/20 bg-[#EAF3FA] p-4 text-sm leading-6 text-[#28547D]">
        <p className="text-base font-black text-slate-950">Custom domain add-on</p>
        <p className="mt-1">
          Stores can request their own domain as a paid Orduva add-on. Pricing starts at <strong>USD $5 / month</strong> or the fixed currency equivalent shown below. Activation is manual while Orduva manages Netlify/custom-domain limits.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-5">
          {CURRENCY_ORDER.map((code) => {
            const amount = CUSTOM_DOMAIN_ADDON_MONTHLY[code];
            return (
              <div key={code} className={`rounded-2xl border px-3 py-2 ${code === selectedPrice.currencyCode ? "border-[#336699] bg-white text-[#0E0E10]" : "border-white/60 bg-white/70 text-[#28547D]"}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.14em]">{code}</p>
                <p className="mt-1 text-sm font-black">{money(amount, code)} / month</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-600" htmlFor="custom-domain-request">Requested domain</label>
            <input
              id="custom-domain-request"
              value={domainName}
              onChange={(event) => setDomainName(event.target.value)}
              className="input mt-2"
              placeholder="example: zimza.store"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">Enter the main domain only. Do not include https://, paths or Orduva subdomains.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Current add-on price</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{selectedPrice.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Billing is monthly and requires owner approval before the custom domain is activated.</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-600" htmlFor="custom-domain-notes">Notes for Orduva</label>
            <textarea
              id="custom-domain-notes"
              value={tenantNotes}
              onChange={(event) => setTenantNotes(event.target.value)}
              className="input mt-2 min-h-24 resize-y"
              placeholder="Who owns the domain, where it is registered, and any setup notes."
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">Expected DNS target: <strong>{dnsTarget}</strong>. Orduva will confirm exact DNS records after approval.</p>
          <button
            type="button"
            onClick={requestDomain}
            disabled={saving || !normaliseCustomDomain(domainName)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? "Saving request…" : "Request custom domain"}
          </button>
        </div>
        {message ? <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
        {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</p> : null}
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-black text-slate-950">Requests for this store</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Requests stay here while billing, DNS and owner approval are completed.</p>
          </div>
          <button type="button" onClick={load} disabled={loading} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait">
            {loading ? "Checking…" : "Refresh"}
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {!loading && !domains.length ? <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">No custom domain request has been submitted yet.</p> : null}
          {domains.map((domain) => (
            <article key={domain.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-all text-lg font-black text-slate-950">{domain.domain_name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">DNS target: {domain.dns_target || dnsTarget}</p>
                  {domain.verification_token ? <p className="mt-1 break-all text-xs font-bold text-slate-500">Verification token: {domain.verification_token}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(domain.status)}`}>{statusLabel(domain.status)}</span>
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(domain.billing_status)}`}>{statusLabel(domain.billing_status)}</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-700">{money(Number(domain.addon_price_monthly || selectedPrice.amount), domain.addon_price_currency || selectedPrice.currencyCode)} / month</p>
              {domain.owner_notes ? <p className="mt-2 rounded-2xl border border-[#336699]/15 bg-white px-3 py-2 text-xs leading-5 text-[#28547D]"><strong>Orduva note:</strong> {domain.owner_notes}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
