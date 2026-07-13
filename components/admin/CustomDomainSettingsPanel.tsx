"use client";

import { useEffect, useState } from "react";
import {
  customDomainActivationChecks,
  customDomainDnsRecords,
  formatCustomDomainUsdPrice,
  normaliseCustomDomain,
  type CustomDomainAddonPrice,
  type CustomDomainBillingStatus,
  type CustomDomainDnsStatus,
  type CustomDomainNetlifyStatus,
  type CustomDomainSslStatus,
  type CustomDomainStatus,
} from "@/lib/custom-domain-addon";

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
  dns_apex_record_status?: CustomDomainDnsStatus | null;
  dns_www_record_status?: CustomDomainDnsStatus | null;
  netlify_alias_status?: CustomDomainNetlifyStatus | null;
  ssl_certificate_status?: CustomDomainSslStatus | null;
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
  if (
    ["active", "approved", "manual", "verified", "issued", "added"].includes(
      clean,
    )
  )
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (["rejected", "disabled", "cancelled", "failed"].includes(clean))
    return "border-red-200 bg-red-50 text-red-800";
  if (
    clean.includes("pending") ||
    clean === "requested" ||
    clean === "configured"
  )
    return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function money(amount: number) {
  return formatCustomDomainUsdPrice(amount);
}

function nextStepText(domain: DomainRow) {
  if (domain.status === "active")
    return "Your custom domain is active. Keep your DNS records in place.";
  if (domain.status === "rejected")
    return "This request was not approved. Check the Orduva note below.";
  if (domain.status === "disabled")
    return "This custom domain has been disabled.";
  if (domain.billing_status !== "active" && domain.billing_status !== "manual")
    return "Next step: pay the USD monthly add-on through Stripe before DNS activation.";
  if (domain.status === "pending_dns")
    return "Next step: update your domain DNS using the records below, then tell Orduva when done.";
  if (domain.status === "pending_owner_review")
    return "Next step: Orduva is checking DNS, Netlify alias and SSL before activation.";
  if (domain.status === "approved")
    return "Approved. Orduva will activate the domain once the final DNS and Netlify checks are complete.";
  return "Request received. Orduva will review the add-on billing and DNS requirements.";
}

function DnsRow({
  type,
  host,
  value,
  copied,
  onCopy,
}: {
  type: string;
  host: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs sm:grid-cols-[110px_90px_1fr_auto] sm:items-center">
      <span className="font-black uppercase tracking-[0.12em] text-slate-500">
        {type}
      </span>
      <span className="font-bold text-slate-700">{host}</span>
      <span className="break-all font-semibold text-slate-950">{value}</span>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-xl border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600 transition hover:bg-slate-50"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function CustomDomainSettingsPanel({
  currencyCode: _currencyCode,
}: {
  currencyCode: string;
}) {
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [dnsTarget, setDnsTarget] = useState("orduva.com");
  const [price, setPrice] = useState<CustomDomainAddonPrice | null>(null);
  const [domainName, setDomainName] = useState("");
  const [tenantNotes, setTenantNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startingCheckoutId, setStartingCheckoutId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copiedDns, setCopiedDns] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/custom-domains", {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          payload?.error || "Could not load custom domain requests.",
        );
      setDomains(payload?.domains || []);
      setDnsTarget(payload?.dnsTarget || "orduva.com");
      setPrice(payload?.price || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load custom domain requests.",
      );
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
      if (!response.ok)
        throw new Error(
          payload?.error || "Could not submit the custom domain request.",
        );
      setDomainName("");
      setTenantNotes("");
      setMessage(
        "Custom domain request saved. Use Pay add-on to start the USD monthly Stripe subscription before DNS activation.",
      );
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit the custom domain request.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function startStripeCheckout(domainId: string) {
    setStartingCheckoutId(domainId);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/custom-domains/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.error || "Could not start Stripe custom-domain checkout.");
      }
      window.location.href = payload.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start Stripe custom-domain checkout.",
      );
      setStartingCheckoutId(null);
    }
  }

  function copyDnsValue(key: string, value: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => undefined);
    }
    setCopiedDns(key);
    window.setTimeout(() => {
      setCopiedDns((current) => (current === key ? "" : current));
    }, 1800);
  }

  const currentLabel = price?.amount
    ? `${money(Number(price.amount))} / month`
    : "$7.50 / month";

  return (
    <div className="grid gap-5">
      <div className="rounded-[24px] border border-[#336699]/20 bg-[#EAF3FA] p-4 text-sm leading-6 text-[#28547D]">
        <p className="text-base font-black text-slate-950">
          Custom domain add-on
        </p>
        <p className="mt-1">
          Stores can request their own external domain as a paid Orduva add-on.
          The add-on is billed in <strong>USD only</strong> through Stripe and
          currently costs <strong>{currentLabel}</strong>. After payment, DNS setup can
          continue, but Orduva still manually checks DNS, Netlify and SSL before activation.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          {["Request", "Billing", "DNS setup", "Activation"].map(
            (step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-[#336699]/15 bg-white px-3 py-2"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#336699]">
                  Step {index + 1}
                </p>
                <p className="mt-1 text-xs font-black text-slate-950">{step}</p>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <label
              className="text-xs font-black uppercase tracking-[0.16em] text-slate-600"
              htmlFor="custom-domain-request"
            >
              Requested domain
            </label>
            <input
              id="custom-domain-request"
              value={domainName}
              onChange={(event) => setDomainName(event.target.value)}
              className="input mt-2"
              placeholder="example: zimza.store"
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Enter the main domain only. Do not include https://, paths or
              Orduva subdomains.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Current add-on price
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {currentLabel}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Monthly USD billing through Stripe. After payment, DNS setup can
              continue, but final activation is still manually approved by
              Orduva.
            </p>
          </div>
          <div className="md:col-span-2">
            <label
              className="text-xs font-black uppercase tracking-[0.16em] text-slate-600"
              htmlFor="custom-domain-notes"
            >
              Notes for Orduva
            </label>
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
          <p className="text-xs leading-5 text-slate-500">
            Expected CNAME target: <strong>{dnsTarget}</strong>. Orduva will
            confirm exact DNS records after billing approval.
          </p>
          <button
            type="button"
            onClick={requestDomain}
            disabled={saving || !normaliseCustomDomain(domainName)}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {saving ? "Saving request…" : "Request custom domain"}
          </button>
        </div>
        {message ? (
          <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error}
          </p>
        ) : null}
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-black text-slate-950">
              Requests for this store
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Requests stay here while billing, DNS and owner approval are
              completed.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-100 disabled:cursor-wait"
          >
            {loading ? "Checking…" : "Refresh"}
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {!loading && !domains.length ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-500">
              No custom domain request has been submitted yet.
            </p>
          ) : null}
          {domains.map((domain) => {
            const records = customDomainDnsRecords(
              domain.domain_name,
              domain.dns_target || dnsTarget,
            );
            const showDns =
              domain.billing_status === "active" ||
              domain.billing_status === "manual" ||
              [
                "pending_dns",
                "pending_owner_review",
                "approved",
                "active",
              ].includes(domain.status);
            const activationChecks = customDomainActivationChecks({
              billingStatus: domain.billing_status,
              dnsApexRecordStatus:
                domain.dns_apex_record_status || "not_started",
              dnsWwwRecordStatus: domain.dns_www_record_status || "not_started",
              netlifyAliasStatus: domain.netlify_alias_status || "not_started",
              sslCertificateStatus:
                domain.ssl_certificate_status || "not_started",
            });
            return (
              <article
                key={domain.id}
                className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all text-lg font-black text-slate-950">
                      {domain.domain_name}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      DNS target: {domain.dns_target || dnsTarget}
                    </p>
                    {domain.verification_token ? (
                      <p className="mt-1 break-all text-xs font-bold text-slate-500">
                        Verification token: {domain.verification_token}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(domain.status)}`}
                    >
                      {statusLabel(domain.status)}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(domain.billing_status)}`}
                    >
                      {statusLabel(domain.billing_status)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {money(
                        Number(domain.addon_price_monthly || price?.amount || 7.5),
                      )}{" "}
                      / month
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Stripe monthly custom-domain add-on.
                    </p>
                  </div>
                  {domain.billing_status !== "active" &&
                  domain.billing_status !== "manual" &&
                  !["active", "disabled", "rejected"].includes(domain.status) ? (
                    <button
                      type="button"
                      onClick={() => startStripeCheckout(domain.id)}
                      disabled={startingCheckoutId === domain.id}
                      className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#336699] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#28547D] disabled:cursor-wait disabled:bg-slate-300"
                    >
                      {startingCheckoutId === domain.id
                        ? "Opening Stripe…"
                        : "Pay add-on"}
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                  <strong>Next step:</strong> {nextStepText(domain)}
                </p>
                {domain.owner_notes ? (
                  <p className="mt-2 rounded-2xl border border-[#336699]/15 bg-white px-3 py-2 text-xs leading-5 text-[#28547D]">
                    <strong>Orduva note:</strong> {domain.owner_notes}
                  </p>
                ) : null}

                {showDns ? (
                  <div className="mt-3 rounded-[20px] border border-[#336699]/20 bg-[#EAF3FA] p-3">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#28547D]">
                      DNS setup instructions
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#28547D]">
                      Add these records at the company where your domain is
                      registered. Copy the values exactly. DNS changes can take
                      time to show globally.
                    </p>
                    <div className="mt-3 grid gap-2 rounded-2xl border border-[#336699]/15 bg-white p-3">
                      {activationChecks.map((check) => (
                        <div
                          key={check.key}
                          className="flex items-start gap-2 text-xs font-bold text-slate-700"
                        >
                          <span
                            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${check.ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                          >
                            {check.ready ? "✓" : "!"}
                          </span>
                          <span>{check.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-2">
                      <DnsRow
                        type={records.wwwType}
                        host={records.wwwHost}
                        value={records.wwwValue}
                        copied={copiedDns === `${domain.id}-www`}
                        onCopy={() =>
                          copyDnsValue(`${domain.id}-www`, records.wwwValue)
                        }
                      />
                      <DnsRow
                        type={records.apexType}
                        host={records.apexHost}
                        value={records.apexValue}
                        copied={copiedDns === `${domain.id}-apex`}
                        onCopy={() =>
                          copyDnsValue(`${domain.id}-apex`, records.apexValue)
                        }
                      />
                      <DnsRow
                        type="Fallback A"
                        host="@"
                        value={records.apexFallbackValue}
                        copied={copiedDns === `${domain.id}-fallback`}
                        onCopy={() =>
                          copyDnsValue(
                            `${domain.id}-fallback`,
                            records.apexFallbackValue,
                          )
                        }
                      />
                      {domain.verification_token ? (
                        <DnsRow
                          type={records.verificationType}
                          host={records.verificationHost}
                          value={domain.verification_token}
                          copied={copiedDns === `${domain.id}-txt`}
                          onCopy={() =>
                            copyDnsValue(
                              `${domain.id}-txt`,
                              domain.verification_token || "",
                            )
                          }
                        />
                      ) : null}
                    </div>
                    <p className="mt-3 rounded-2xl border border-[#336699]/15 bg-white px-3 py-2 text-xs font-bold text-[#28547D]">
                      After changing DNS, send Orduva a message so we can check
                      Netlify, SSL and activate the domain.
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(domain.dns_apex_record_status || "not_started")}`}
                      >
                        Root DNS:{" "}
                        {statusLabel(
                          domain.dns_apex_record_status || "not_started",
                        )}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(domain.dns_www_record_status || "not_started")}`}
                      >
                        WWW DNS:{" "}
                        {statusLabel(
                          domain.dns_www_record_status || "not_started",
                        )}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(domain.netlify_alias_status || "not_started")}`}
                      >
                        Netlify:{" "}
                        {statusLabel(
                          domain.netlify_alias_status || "not_started",
                        )}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(domain.ssl_certificate_status || "not_started")}`}
                      >
                        SSL:{" "}
                        {statusLabel(
                          domain.ssl_certificate_status || "not_started",
                        )}
                      </span>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
