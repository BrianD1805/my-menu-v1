"use client";

import { useEffect, useState } from "react";
import { formatCustomDomainUsdPrice, normaliseCustomDomain, type CustomDomainAddonPrice, type CustomDomainBillingStatus, type CustomDomainStatus } from "@/lib/custom-domain-addon";

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

function statusLabel(status: string) {
  return String(status || "requested").replace(/_/g, " ");
}

function statusClass(status: string) {
  const clean = String(status || "").toLowerCase();
  if (clean === "active" || clean === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (clean === "rejected" || clean === "disabled") return "border-red-200 bg-red-50 text-red-800";
  if (clean.includes("pending") || clean === "requested") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function money(amount: number) {
  return formatCustomDomainUsdPrice(amount);
}

function nextStepText(domain: DomainRow) {
  if (domain.status === "active") return "Your custom domain is active. Keep your DNS records in place.";
  if (domain.status === "rejected") return "This request was not approved. Check the Orduva note below.";
  if (domain.status === "disabled") return "This custom domain has been disabled.";
  if (domain.billing_status !== "active" && domain.billing_status !== "manual") return "Next step: Orduva will arrange the USD add-on billing through Stripe before DNS activation.";
  if (domain.status === "pending_dns") return "Next step: update your domain DNS using the records Orduva provides.";
  if (domain.status === "pending_owner_review") return "Next step: Orduva will check DNS and activate the domain when ready.";
  if (domain.status === "approved") return "Approved. Orduva will activate the domain once the final DNS and Netlify checks are complete.";
  return "Request received. Orduva will review the add-on billing and DNS requirements.";
}

export default function CustomDomainSettingsPanel({ currencyCode: _currencyCode }: { currencyCode: string }) {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [dnsTarget, setDnsTarget] = useState("orduva.com");
  const [price, setPrice] = useState<CustomDomainAddonPrice | null>(null);
  const [domainName, setDomainName] = useState("");
  const [tenantNotes, setTenantNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/custom-domains", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Could not load custom domain requests.");
      setDomains(payload?.domains || []);
      setDnsTarget(payload?.dnsTarget || "orduva.com");
      setPrice(payload?.price || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load custom domain requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function requestDomain() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const cleanDomain = normaliseCustomDomain(domainName);
      const response = await fetch("/api/admin/custom-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainName: cleanDomain, tenantNotes }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Could not submit the custom domain request.");
      setDomainName("");
      setTenantNotes("");
      setMessage("Custom domain request saved. Orduva will set up the USD monthly add-on billing before DNS activation.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the custom domain request.");
    } finally {
      setSaving(false);
    }
  }

  const currentLabel = price?.amount ? `${money(Number(price.amount))} / month` : "$7.50 / month";

  return (
    <div className="grid gap-5">
      <div className="rounded-[24px] border border-[#336699]/20 bg-[#EAF3FA] p-4 text-sm leading-6 text-[#28547D]">
        <p className="text-base font-black text-slate-950">Custom domain add-on</p>
        <p className="mt-1">
          Stores can request their own external domain as a paid Orduva add-on. The add-on is billed in <strong>USD only</strong> through Stripe and currently costs <strong>{currentLabel}</strong>. Activation is manual while Orduva manages billing, DNS and Netlify domain limits.
        </p>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-600" htmlFor="custom-domain-request">Requested domain</label>
            <input id="custom-domain-request" value={domainName} onChange={(event) => setDomainName(event.target.value)} className="input mt-2" placeholder="example: zimza.store" />
            <p className="mt-2 text-xs leading-5 text-slate-500">Enter the main domain only. Do not include https://, paths or Orduva subdomains.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Current add-on price</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{currentLabel}</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Monthly USD billing through Stripe. Orduva must approve billing before the custom domain is activated.</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-600" htmlFor="custom-domain-notes">Notes for Orduva</label>
            <textarea id="custom-domain-notes" value={tenantNotes} onChange={(event) => setTenantNotes(event.target.value)} className="input mt-2 min-h-24 resize-y" placeholder="Who owns the domain, where it is registered, and any setup notes." />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">Expected DNS target: <strong>{dnsTarget}</strong>. Orduva will confirm exact DNS records after billing approval.</p>
          <button type="button" onClick={requestDomain} disabled={saving || !normaliseCustomDomain(domainName)} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">
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
              <p className="mt-3 text-sm font-bold text-slate-700">{money(Number(domain.addon_price_monthly || price?.amount || 7.5))} / month</p>
              <p className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600"><strong>Next step:</strong> {nextStepText(domain)}</p>
              {domain.owner_notes ? <p className="mt-2 rounded-2xl border border-[#336699]/15 bg-white px-3 py-2 text-xs leading-5 text-[#28547D]"><strong>Orduva note:</strong> {domain.owner_notes}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
