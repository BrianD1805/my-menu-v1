"use client";

import { useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";
import {
  CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY,
  customDomainActivationBlockers,
  customDomainActivationChecks,
  customDomainDnsRecords,
  customDomainEffectiveDnsTarget,
  formatCustomDomainUsdPrice,
  isCustomDomainActivationReady,
  type CustomDomainAddonPrice,
  type CustomDomainBillingStatus,
  type CustomDomainDnsStatus,
  type CustomDomainNetlifyStatus,
  type CustomDomainSslStatus,
  type CustomDomainStatus,
} from "@/lib/custom-domain-addon";

type DomainRow = {
  id: string;
  tenant_id: string;
  domain_name: string;
  normalized_domain: string;
  status: CustomDomainStatus;
  billing_status: CustomDomainBillingStatus;
  addon_price_currency: string;
  addon_price_monthly: number;
  billing_interval: string;
  requested_by_email: string | null;
  tenant_notes: string | null;
  owner_notes: string | null;
  dns_target: string | null;
  verification_token: string | null;
  dns_apex_record_status?: CustomDomainDnsStatus | null;
  dns_www_record_status?: CustomDomainDnsStatus | null;
  netlify_alias_status?: CustomDomainNetlifyStatus | null;
  ssl_certificate_status?: CustomDomainSslStatus | null;
  stripe_price_id?: string | null;
  stripe_checkout_session_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_subscription_item_id?: string | null;
  stripe_customer_id?: string | null;
  netlify_site_id?: string | null;
  netlify_domain_alias_id?: string | null;
  approved_at: string | null;
  activated_at: string | null;
  disabled_at?: string | null;
  created_at: string | null;
  updated_at: string | null;
  tenants?: { name?: string | null; slug?: string | null } | null;
};

const STATUS_OPTIONS: CustomDomainStatus[] = [
  "requested",
  "billing_pending",
  "pending_dns",
  "pending_owner_review",
  "approved",
  "active",
  "rejected",
  "disabled",
];
const BILLING_OPTIONS: CustomDomainBillingStatus[] = [
  "not_started",
  "addon_pending",
  "active",
  "past_due",
  "cancelled",
  "manual",
];
const DNS_OPTIONS: CustomDomainDnsStatus[] = [
  "not_started",
  "not_required",
  "pending",
  "configured",
  "verified",
  "failed",
];
const NETLIFY_OPTIONS: CustomDomainNetlifyStatus[] = [
  "not_started",
  "pending",
  "added",
  "verified",
  "failed",
];
const SSL_OPTIONS: CustomDomainSslStatus[] = [
  "not_started",
  "pending",
  "issued",
  "failed",
];

function label(value: string) {
  return String(value || "").replace(/_/g, " ");
}

function money(amount: number) {
  return formatCustomDomainUsdPrice(amount);
}

function tone(value: string) {
  const clean = String(value || "").toLowerCase();
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

function quickSteps(domain: DomainRow) {
  if (domain.status === "active")
    return "Live. Keep Netlify/DNS notes updated.";
  if (domain.status === "disabled")
    return "Disabled. Re-enable only after billing and DNS are valid.";
  if (domain.billing_status !== "active" && domain.billing_status !== "manual")
    return "Start with Stripe billing, then move to DNS.";
  if (domain.status === "pending_dns")
    return "Ask the store owner to complete the DNS records below.";
  if (domain.status === "pending_owner_review")
    return "Check DNS, Netlify alias and SSL, then activate when all checks are green.";
  return "Use the action buttons to move this request through billing, DNS, approval and activation.";
}

function checklistLabel(domain: DomainRow) {
  const ready = isCustomDomainActivationReady({
    billingStatus: domain.billing_status,
    dnsApexRecordStatus: domain.dns_apex_record_status || "not_started",
    dnsWwwRecordStatus: domain.dns_www_record_status || "not_started",
    netlifyAliasStatus: domain.netlify_alias_status || "not_started",
    sslCertificateStatus: domain.ssl_certificate_status || "not_started",
  });
  return ready ? "Ready to activate" : "Activation checklist incomplete";
}

function OwnerDnsRow({
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
    <div className="grid gap-2 rounded-2xl border border-[#336699]/15 bg-white px-3 py-2 text-xs sm:grid-cols-[116px_90px_1fr_auto] sm:items-center">
      <span className="font-black uppercase tracking-[0.12em] text-[#5C5F66]">
        {type}
      </span>
      <span className="font-bold text-[#28547D]">{host}</span>
      <span className="break-all font-semibold text-[#0E0E10]">{value}</span>
      <button
        type="button"
        onClick={onCopy}
        className="rounded-xl border border-[#336699]/20 bg-[#F3F7FA] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#28547D] transition hover:bg-[#EAF3FA]"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function OwnerCustomDomainsPanel() {
  const { platformHeaders } = useOwnerPlatformAccess();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [addonSettings, setAddonSettings] =
    useState<CustomDomainAddonPrice | null>(null);
  const [dnsTarget, setDnsTarget] = useState("orduva.netlify.app");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [checkingDnsId, setCheckingDnsId] = useState<string | null>(null);
  const [dnsCheckResults, setDnsCheckResults] = useState<Record<string, any>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("open");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [stripeItems, setStripeItems] = useState<Record<string, string>>({});
  const [stripeSubscriptions, setStripeSubscriptions] = useState<Record<string, string>>({});
  const [netlifyAliases, setNetlifyAliases] = useState<Record<string, string>>(
    {},
  );
  const [netlifySites, setNetlifySites] = useState<Record<string, string>>({});
  const [copiedDns, setCopiedDns] = useState("");
  const [monthlyPriceUsd, setMonthlyPriceUsd] = useState("7.50");
  const [stripePriceId, setStripePriceId] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/platform/custom-domains", {
        headers: platformHeaders,
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(payload?.error || "Could not load custom domains.");
      const list = (payload?.domains || []) as DomainRow[];
      const settings = payload?.addonSettings as
        CustomDomainAddonPrice | undefined;
      setDomains(list);
      setDnsTarget(payload?.dnsTarget || "orduva.netlify.app");
      setAddonSettings(settings || null);
      setMonthlyPriceUsd(Number(settings?.amount ?? 7.5).toFixed(2));
      setStripePriceId(settings?.stripePriceId || "");
      setNotes(
        Object.fromEntries(
          list.map((item) => [item.id, item.owner_notes || ""]),
        ),
      );
      setStripeItems(
        Object.fromEntries(
          list.map((item) => [item.id, item.stripe_subscription_item_id || ""]),
        ),
      );
      setStripeSubscriptions(
        Object.fromEntries(
          list.map((item) => [item.id, item.stripe_subscription_id || ""]),
        ),
      );
      setNetlifyAliases(
        Object.fromEntries(
          list.map((item) => [item.id, item.netlify_domain_alias_id || ""]),
        ),
      );
      setNetlifySites(
        Object.fromEntries(
          list.map((item) => [item.id, item.netlify_site_id || ""]),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load custom domains.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    platformHeaders["x-orduva-platform-key"],
    platformHeaders["x-orduva-platform-2fa-session"],
  ]);

  const visible = useMemo(() => {
    if (filter === "all") return domains;
    if (filter === "active")
      return domains.filter((domain) => domain.status === "active");
    return domains.filter(
      (domain) => !["active", "rejected", "disabled"].includes(domain.status),
    );
  }, [domains, filter]);

  async function saveSettings() {
    setSavingSettings(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/platform/custom-domains", {
        method: "PATCH",
        headers: { ...platformHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "settings",
          monthlyPriceUsd,
          stripePriceId,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(payload?.error || "Could not save add-on settings.");
      setMessage("Custom domain USD monthly add-on settings saved.");
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save add-on settings.",
      );
    } finally {
      setSavingSettings(false);
    }
  }

  async function updateDomain(id: string, values: Record<string, unknown>) {
    setSavingId(id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/platform/custom-domains", {
        method: "PATCH",
        headers: { ...platformHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...values }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(payload?.error || "Could not update custom domain.");
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update custom domain.",
      );
    } finally {
      setSavingId(null);
    }
  }


  async function checkDomainDns(id: string) {
    setCheckingDnsId(id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/platform/custom-domains", {
        method: "PATCH",
        headers: { ...platformHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "dns_check", id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(payload?.error || "Could not check custom domain DNS.");
      if (payload?.domain) {
        setDomains((current) =>
          current.map((item) => (item.id === id ? payload.domain : item)),
        );
      }
      if (payload?.dnsCheck) {
        setDnsCheckResults((current) => ({ ...current, [id]: payload.dnsCheck }));
      }
      setMessage("DNS check complete. Root and WWW checklist statuses were updated where Orduva could verify the records.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not check custom domain DNS.",
      );
    } finally {
      setCheckingDnsId(null);
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

  const currentPriceAmount = Number(
    addonSettings?.amount ?? (monthlyPriceUsd || 7.5),
  );
  const currentPrice = `${money(currentPriceAmount)} / month`;

  return (
    <section className="space-y-5">
      <div className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_54px_rgba(14,14,16,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#336699]">
              Custom domains
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0E0E10]">
              Domain DNS, billing & activation
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5C5F66]">
              Custom domains remain manually controlled. Complete Stripe
              billing, DNS, Netlify alias and SSL checks before activating a
              domain.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#252528] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Checking…" : "Refresh"}
          </button>
        </div>

        <div className="mt-5 rounded-[24px] border border-[#336699]/20 bg-[#EAF3FA] p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#28547D]">
                Current add-on price
              </p>
              <p className="mt-1 text-2xl font-black text-[#0E0E10]">
                {currentPrice}
              </p>
              <p className="mt-1 text-xs font-bold text-[#5C5F66]">
                USD monthly only.
              </p>
            </div>
            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#28547D]">
              USD monthly price
              <input
                value={monthlyPriceUsd}
                onChange={(event) => setMonthlyPriceUsd(event.target.value)}
                className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]"
                inputMode="decimal"
                placeholder="7.50"
              />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#28547D]">
              Stripe Price ID
              <input
                value={stripePriceId}
                onChange={(event) => setStripePriceId(event.target.value)}
                className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]"
                placeholder="price_..."
              />
              <span className="text-[10px] normal-case tracking-normal text-[#5C5F66]">
                Fallback env key: {CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY}
              </span>
            </label>
            <button
              type="button"
              onClick={saveSettings}
              disabled={savingSettings}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#336699] px-5 py-3 text-sm font-black text-white transition hover:bg-[#28547D] disabled:cursor-wait disabled:opacity-60"
            >
              {savingSettings ? "Saving…" : "Save price"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["open", "active", "all"].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${filter === value ? "bg-[#336699] text-white" : "border border-[#0E0E10]/10 bg-white text-[#5C5F66]"}`}
            >
              {value}
            </button>
          ))}
        </div>
        {message ? (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error}
          </p>
        ) : null}
      </div>

      {!loading && !visible.length ? (
        <p className="rounded-[28px] border border-dashed border-[#0E0E10]/15 bg-white p-6 text-sm font-bold text-[#5C5F66]">
          No custom domain requests in this view.
        </p>
      ) : null}

      <div className="grid gap-4">
        {visible.map((domain) => {
          const effectiveDnsTarget = customDomainEffectiveDnsTarget(
            domain.dns_target || dnsTarget,
          );
          const records = customDomainDnsRecords(
            domain.domain_name,
            effectiveDnsTarget,
          );
          const activationInput = {
            billingStatus: domain.billing_status,
            dnsApexRecordStatus: domain.dns_apex_record_status || "not_started",
            dnsWwwRecordStatus: domain.dns_www_record_status || "not_started",
            netlifyAliasStatus: domain.netlify_alias_status || "not_started",
            sslCertificateStatus:
              domain.ssl_certificate_status || "not_started",
          };
          const activationReady = isCustomDomainActivationReady({
            status: domain.status,
            ...activationInput,
          });
          const activationChecks =
            customDomainActivationChecks(activationInput);
          const activationBlockers =
            customDomainActivationBlockers(activationInput);
          const activationTitle = activationReady
            ? "Activate this custom domain"
            : activationBlockers.join(" ");
          const dnsCheckResult = dnsCheckResults[domain.id];
          return (
            <article
              key={domain.id}
              className="overflow-hidden rounded-[30px] border border-[#0E0E10]/10 bg-white shadow-[0_14px_44px_rgba(14,14,16,0.07)]"
            >
              <header className="border-b border-[#0E0E10]/10 bg-[#F3F7FA] px-5 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="break-all text-xl font-semibold text-[#0E0E10]">
                      {domain.domain_name}
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#5C5F66]">
                      {domain.tenants?.name || "Store"} ·{" "}
                      {domain.tenants?.slug || domain.tenant_id}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${tone(domain.status)}`}
                    >
                      {label(domain.status)}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${tone(domain.billing_status)}`}
                    >
                      {label(domain.billing_status)}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${activationReady ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
                    >
                      {checklistLabel(domain)}
                    </span>
                  </div>
                </div>
              </header>
              <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr]">
                <div className="grid gap-3 text-sm">
                  <p>
                    <strong>Price:</strong>{" "}
                    {money(
                      Number(
                        domain.addon_price_monthly ||
                          addonSettings?.amount ||
                          7.5,
                      ),
                    )}{" "}
                    / month
                  </p>
                  <p>
                    <strong>Netlify www CNAME target:</strong>{" "}
                    {effectiveDnsTarget}
                  </p>
                  <p className="break-all">
                    <strong>Verification token:</strong>{" "}
                    {domain.verification_token || "Not generated"}
                  </p>
                  <p>
                    <strong>Requested by:</strong>{" "}
                    {domain.requested_by_email || "Unknown"}
                  </p>
                  <p>
                    <strong>Stripe price:</strong>{" "}
                    {domain.stripe_price_id ||
                      addonSettings?.stripePriceId ||
                      CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY}
                  </p>
                  {domain.stripe_checkout_session_id ? (
                    <p className="break-all">
                      <strong>Stripe checkout:</strong>{" "}
                      {domain.stripe_checkout_session_id}
                    </p>
                  ) : null}
                  {domain.stripe_subscription_id ? (
                    <p className="break-all">
                      <strong>Stripe subscription:</strong>{" "}
                      {domain.stripe_subscription_id}
                    </p>
                  ) : null}
                  <p>
                    <strong>Next step:</strong> {quickSteps(domain)}
                  </p>
                  {domain.tenant_notes ? (
                    <p className="rounded-2xl border border-[#0E0E10]/10 bg-[#F3F7FA] px-3 py-2">
                      <strong>Store note:</strong> {domain.tenant_notes}
                    </p>
                  ) : null}

                  <div className="rounded-2xl border border-[#336699]/20 bg-[#EAF3FA] p-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#28547D]">
                      Customer DNS records
                    </p>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#28547D]">
                      For the root domain, use the ALIAS/ANAME value if supported.
                      Use the fallback A record only when ALIAS/ANAME is not
                      supported. Do not ask the customer to add both root records.
                      The optional TXT record is Orduva verification only.
                    </p>
                    <div className="mt-3 grid gap-2">
                      <OwnerDnsRow
                        type={records.wwwType}
                        host={records.wwwHost}
                        value={records.wwwValue}
                        copied={copiedDns === `${domain.id}-www`}
                        onCopy={() =>
                          copyDnsValue(`${domain.id}-www`, records.wwwValue)
                        }
                      />
                      <OwnerDnsRow
                        type={records.apexType}
                        host={records.apexHost}
                        value={records.apexValue}
                        copied={copiedDns === `${domain.id}-apex`}
                        onCopy={() =>
                          copyDnsValue(`${domain.id}-apex`, records.apexValue)
                        }
                      />
                      <OwnerDnsRow
                        type={`${records.apexFallbackType} — only if no ALIAS`}
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
                      <OwnerDnsRow
                        type={records.verificationType}
                        host={records.verificationHost}
                        value={
                          domain.verification_token || "verification token"
                        }
                        copied={copiedDns === `${domain.id}-txt`}
                        onCopy={() =>
                          copyDnsValue(
                            `${domain.id}-txt`,
                            domain.verification_token || "verification token",
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div
                    className={`grid gap-3 rounded-2xl border p-3 ${activationReady ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p
                        className={`text-xs font-black uppercase tracking-[0.14em] ${activationReady ? "text-emerald-800" : "text-amber-800"}`}
                      >
                        Activation checklist
                      </p>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${activationReady ? "border-emerald-200 bg-white text-emerald-800" : "border-amber-200 bg-white text-amber-800"}`}
                      >
                        {activationReady ? "Ready" : "Cannot activate yet"}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {activationChecks.map((check) => (
                        <div
                          key={check.key}
                          className="flex items-start gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-[#0E0E10]"
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
                    {!activationReady ? (
                      <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2 text-xs leading-5 text-amber-900">
                        <strong>Cannot activate yet:</strong>
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {activationBlockers.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800">
                        All required checks are complete. Activation will route
                        this domain to the selected store.
                      </p>
                    )}
                  </div>

                  {dnsCheckResult ? (
                    <div className="grid gap-2 rounded-2xl border border-[#336699]/20 bg-white p-3 text-xs leading-5 text-[#28547D]">
                      <p className="font-black uppercase tracking-[0.14em] text-[#28547D]">
                        Last DNS check
                      </p>
                      <p>
                        Checked: {new Date(dnsCheckResult.checkedAt).toLocaleString()}
                      </p>
                      <p>
                        <strong>Root/apex:</strong> {dnsCheckResult.apex?.status} — {dnsCheckResult.apex?.message}
                      </p>
                      <p className="break-all">
                        Found: {(dnsCheckResult.apex?.found || []).join(", ") || "No public record found yet"}
                      </p>
                      <p>
                        <strong>WWW:</strong> {dnsCheckResult.www?.status} — {dnsCheckResult.www?.message}
                      </p>
                      <p className="break-all">
                        Found: {(dnsCheckResult.www?.found || []).join(", ") || "No public record found yet"}
                      </p>
                      <p className="font-bold text-[#5C5F66]">
                        Netlify alias and SSL are still manual checks until Netlify API support is added.
                      </p>
                    </div>
                  ) : null}

                  <div className="grid gap-2 rounded-2xl border border-[#0E0E10]/10 bg-[#F3F7FA] p-3">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                      Quick actions
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateDomain(domain.id, {
                            status: "billing_pending",
                            billingStatus: "addon_pending",
                            stripePriceId:
                              addonSettings?.stripePriceId ||
                              stripePriceId ||
                              null,
                          })
                        }
                        className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800"
                      >
                        Mark billing required
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateDomain(domain.id, {
                            billingStatus: "manual",
                            status: "pending_dns",
                          })
                        }
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800"
                      >
                        Billing active/manual
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateDomain(domain.id, {
                            status: "pending_dns",
                            dnsApexRecordStatus: "pending",
                            dnsWwwRecordStatus: "pending",
                            netlifyAliasStatus: "pending",
                            sslCertificateStatus: "pending",
                          })
                        }
                        className="rounded-2xl border border-[#336699]/20 bg-white px-3 py-2 text-xs font-black text-[#28547D]"
                      >
                        Move to DNS
                      </button>
                      <button
                        type="button"
                        onClick={() => checkDomainDns(domain.id)}
                        disabled={checkingDnsId === domain.id}
                        className="rounded-2xl border border-[#336699]/20 bg-white px-3 py-2 text-xs font-black text-[#28547D] disabled:cursor-wait disabled:opacity-60"
                      >
                        {checkingDnsId === domain.id ? "Checking DNS…" : "Check DNS now"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateDomain(domain.id, {
                            status: "pending_owner_review",
                          })
                        }
                        className="rounded-2xl border border-[#336699]/20 bg-white px-3 py-2 text-xs font-black text-[#28547D]"
                      >
                        DNS under review
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateDomain(domain.id, { status: "approved" })
                        }
                        className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        title={activationTitle}
                        onClick={() =>
                          updateDomain(domain.id, {
                            status: "active",
                            billingStatus:
                              domain.billing_status === "active"
                                ? "active"
                                : "manual",
                          })
                        }
                        disabled={!activationReady || savingId === domain.id}
                        className="rounded-2xl bg-emerald-700 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        Activate domain
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateDomain(domain.id, { status: "rejected" })
                        }
                        className="rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-800"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateDomain(domain.id, {
                            status: "disabled",
                            billingStatus: "cancelled",
                          })
                        }
                        className="rounded-2xl bg-red-700 px-3 py-2 text-xs font-black text-white"
                      >
                        Disable
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                      Domain status
                      <select
                        value={domain.status}
                        onChange={(event) =>
                          updateDomain(domain.id, {
                            status: event.target.value,
                          })
                        }
                        className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]"
                      >
                        {STATUS_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {label(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                      Add-on billing
                      <select
                        value={domain.billing_status}
                        onChange={(event) =>
                          updateDomain(domain.id, {
                            billingStatus: event.target.value,
                          })
                        }
                        className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]"
                      >
                        {BILLING_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {label(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                      Apex/root DNS
                      <select
                        value={domain.dns_apex_record_status || "not_started"}
                        onChange={(event) =>
                          updateDomain(domain.id, {
                            dnsApexRecordStatus: event.target.value,
                          })
                        }
                        className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]"
                      >
                        {DNS_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {label(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                      WWW DNS
                      <select
                        value={domain.dns_www_record_status || "not_started"}
                        onChange={(event) =>
                          updateDomain(domain.id, {
                            dnsWwwRecordStatus: event.target.value,
                          })
                        }
                        className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]"
                      >
                        {DNS_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {label(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                      Netlify alias
                      <select
                        value={domain.netlify_alias_status || "not_started"}
                        onChange={(event) =>
                          updateDomain(domain.id, {
                            netlifyAliasStatus: event.target.value,
                          })
                        }
                        className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]"
                      >
                        {NETLIFY_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {label(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                      SSL certificate
                      <select
                        value={domain.ssl_certificate_status || "not_started"}
                        onChange={(event) =>
                          updateDomain(domain.id, {
                            sslCertificateStatus: event.target.value,
                          })
                        }
                        className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]"
                      >
                        {SSL_OPTIONS.map((value) => (
                          <option key={value} value={value}>
                            {label(value)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                    Stripe subscription id
                    <input
                      value={stripeSubscriptions[domain.id] || ""}
                      onChange={(event) =>
                        setStripeSubscriptions((current) => ({
                          ...current,
                          [domain.id]: event.target.value,
                        }))
                      }
                      className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#0E0E10]"
                      placeholder="sub_..."
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                    Stripe subscription item id
                    <input
                      value={stripeItems[domain.id] || ""}
                      onChange={(event) =>
                        setStripeItems((current) => ({
                          ...current,
                          [domain.id]: event.target.value,
                        }))
                      }
                      className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#0E0E10]"
                      placeholder="si_..."
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                    Netlify site id / note
                    <input
                      value={netlifySites[domain.id] || ""}
                      onChange={(event) =>
                        setNetlifySites((current) => ({
                          ...current,
                          [domain.id]: event.target.value,
                        }))
                      }
                      className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#0E0E10]"
                      placeholder="Manual Netlify site reference"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                    Netlify domain alias id / note
                    <input
                      value={netlifyAliases[domain.id] || ""}
                      onChange={(event) =>
                        setNetlifyAliases((current) => ({
                          ...current,
                          [domain.id]: event.target.value,
                        }))
                      }
                      className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#0E0E10]"
                      placeholder="Manual Netlify alias reference"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">
                    Owner notes
                    <textarea
                      value={notes[domain.id] || ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [domain.id]: event.target.value,
                        }))
                      }
                      className="min-h-24 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#0E0E10]"
                      placeholder="DNS, Netlify alias, billing and approval notes."
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateDomain(domain.id, {
                        ownerNotes: notes[domain.id] || "",
                        stripeSubscriptionId: stripeSubscriptions[domain.id] || "",
                        stripeSubscriptionItemId: stripeItems[domain.id] || "",
                        netlifySiteId: netlifySites[domain.id] || "",
                        netlifyDomainAliasId: netlifyAliases[domain.id] || "",
                      })
                    }
                    disabled={savingId === domain.id}
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white transition hover:bg-[#252528] disabled:cursor-wait disabled:opacity-60"
                  >
                    {savingId === domain.id ? "Saving…" : "Save owner details"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
