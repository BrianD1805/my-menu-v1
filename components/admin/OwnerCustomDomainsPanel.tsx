"use client";

import { useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";
import { CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY, type CustomDomainAddonPrice } from "@/lib/custom-domain-addon";
import { formatPlanPrice } from "@/lib/pricing";

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
  stripe_price_id?: string | null;
  stripe_subscription_item_id?: string | null;
  stripe_checkout_session_id?: string | null;
  netlify_site_id?: string | null;
  netlify_domain_alias_id?: string | null;
  approved_at: string | null;
  activated_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  tenants?: { name?: string | null; slug?: string | null } | null;
};

const STATUS_OPTIONS = ["requested", "billing_pending", "pending_dns", "pending_owner_review", "approved", "active", "rejected", "disabled"];
const BILLING_OPTIONS = ["not_started", "addon_pending", "active", "past_due", "cancelled", "manual"];

function label(value: string) {
  return String(value || "").replace(/_/g, " ");
}

function money(amount: number) {
  return formatPlanPrice(amount, "USD", { forceDecimals: true });
}

function tone(value: string) {
  const clean = String(value || "").toLowerCase();
  if (clean === "active" || clean === "approved" || clean === "manual") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (clean === "rejected" || clean === "disabled" || clean === "cancelled") return "border-red-200 bg-red-50 text-red-800";
  if (clean.includes("pending") || clean === "requested") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function quickSteps(status: string, billingStatus: string) {
  if (status === "active") return "Live. Keep Netlify/DNS notes updated.";
  if (status === "disabled") return "Disabled. Re-enable only after billing and DNS are valid.";
  if (billingStatus !== "active" && billingStatus !== "manual") return "Start with Stripe billing, then move to DNS.";
  if (status === "pending_dns") return "Ask store owner to complete DNS records.";
  if (status === "pending_owner_review") return "Check DNS/Netlify/SSL, then approve or activate.";
  return "Use the action buttons to move this request through billing, DNS, approval and activation.";
}

export default function OwnerCustomDomainsPanel() {
  const { platformHeaders } = useOwnerPlatformAccess();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [addonSettings, setAddonSettings] = useState<CustomDomainAddonPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("open");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [stripeItems, setStripeItems] = useState<Record<string, string>>({});
  const [netlifyAliases, setNetlifyAliases] = useState<Record<string, string>>({});
  const [monthlyPriceUsd, setMonthlyPriceUsd] = useState("7.50");
  const [stripePriceId, setStripePriceId] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/platform/custom-domains", { headers: platformHeaders, cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Could not load custom domains.");
      const list = (payload?.domains || []) as DomainRow[];
      const settings = payload?.addonSettings as CustomDomainAddonPrice | undefined;
      setDomains(list);
      setAddonSettings(settings || null);
      setMonthlyPriceUsd(String(settings?.amount ?? 7.5));
      setStripePriceId(settings?.stripePriceId || "");
      setNotes(Object.fromEntries(list.map((item) => [item.id, item.owner_notes || ""])));
      setStripeItems(Object.fromEntries(list.map((item) => [item.id, item.stripe_subscription_item_id || ""])));
      setNetlifyAliases(Object.fromEntries(list.map((item) => [item.id, item.netlify_domain_alias_id || ""])));
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

  async function saveSettings() {
    setSavingSettings(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/platform/custom-domains", {
        method: "PATCH",
        headers: { ...platformHeaders, "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "settings", monthlyPriceUsd, stripePriceId }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Could not save add-on settings.");
      setMessage("Custom domain USD monthly add-on settings saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save add-on settings.");
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
      if (!response.ok) throw new Error(payload?.error || "Could not update custom domain.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update custom domain.");
    } finally {
      setSavingId(null);
    }
  }

  const currentPrice = addonSettings?.label || `${money(Number(monthlyPriceUsd || 7.5))} / month`;

  return (
    <section className="space-y-5">
      <div className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_54px_rgba(14,14,16,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#336699]">Custom domains</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0E0E10]">Domain add-on billing & activation</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5C5F66]">
              Custom domains are billed in USD only through Stripe. Keep activation manual until Stripe billing, DNS, Netlify alias and SSL checks are complete.
            </p>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#252528] disabled:cursor-wait disabled:opacity-60">
            {loading ? "Checking…" : "Refresh"}
          </button>
        </div>

        <div className="mt-5 rounded-[24px] border border-[#336699]/20 bg-[#EAF3FA] p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#28547D]">Current add-on price</p>
              <p className="mt-1 text-2xl font-black text-[#0E0E10]">{currentPrice}</p>
              <p className="mt-1 text-xs font-bold text-[#5C5F66]">USD monthly only.</p>
            </div>
            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#28547D]">USD monthly price
              <input value={monthlyPriceUsd} onChange={(event) => setMonthlyPriceUsd(event.target.value)} className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]" inputMode="decimal" placeholder="7.50" />
            </label>
            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#28547D]">Stripe Price ID
              <input value={stripePriceId} onChange={(event) => setStripePriceId(event.target.value)} className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-bold normal-case tracking-normal text-[#0E0E10]" placeholder="price_..." />
              <span className="text-[10px] normal-case tracking-normal text-[#5C5F66]">Fallback env key: {CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY}</span>
            </label>
            <button type="button" onClick={saveSettings} disabled={savingSettings} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#336699] px-5 py-3 text-sm font-black text-white transition hover:bg-[#28547D] disabled:cursor-wait disabled:opacity-60">
              {savingSettings ? "Saving…" : "Save price"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {["open", "active", "all"].map((value) => (
            <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.14em] ${filter === value ? "bg-[#336699] text-white" : "border border-[#0E0E10]/10 bg-white text-[#5C5F66]"}`}>{value}</button>
          ))}
        </div>
        {message ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{message}</p> : null}
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
                <p><strong>Price:</strong> {money(Number(domain.addon_price_monthly || addonSettings?.amount || 7.5))} / month</p>
                <p><strong>DNS target:</strong> {domain.dns_target || "orduva.com"}</p>
                <p className="break-all"><strong>Verification token:</strong> {domain.verification_token || "Not generated"}</p>
                <p><strong>Requested by:</strong> {domain.requested_by_email || "Unknown"}</p>
                <p><strong>Stripe price:</strong> {domain.stripe_price_id || addonSettings?.stripePriceId || CUSTOM_DOMAIN_STRIPE_PRICE_ENV_KEY}</p>
                <p><strong>Next step:</strong> {quickSteps(domain.status, domain.billing_status)}</p>
                {domain.tenant_notes ? <p className="rounded-2xl border border-[#0E0E10]/10 bg-[#F3F7FA] px-3 py-2"><strong>Store note:</strong> {domain.tenant_notes}</p> : null}
              </div>
              <div className="grid gap-3">
                <div className="grid gap-2 rounded-2xl border border-[#0E0E10]/10 bg-[#F3F7FA] p-3">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">Quick actions</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => updateDomain(domain.id, { status: "billing_pending", billingStatus: "addon_pending", stripePriceId: addonSettings?.stripePriceId || stripePriceId || null })} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">Mark billing required</button>
                    <button type="button" onClick={() => updateDomain(domain.id, { billingStatus: "manual", status: "pending_dns" })} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">Billing active/manual</button>
                    <button type="button" onClick={() => updateDomain(domain.id, { status: "pending_dns" })} className="rounded-2xl border border-[#336699]/20 bg-white px-3 py-2 text-xs font-black text-[#28547D]">Move to DNS</button>
                    <button type="button" onClick={() => updateDomain(domain.id, { status: "pending_owner_review" })} className="rounded-2xl border border-[#336699]/20 bg-white px-3 py-2 text-xs font-black text-[#28547D]">DNS under review</button>
                    <button type="button" onClick={() => updateDomain(domain.id, { status: "approved" })} className="rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-800">Approve</button>
                    <button type="button" onClick={() => updateDomain(domain.id, { status: "active", billingStatus: domain.billing_status === "active" ? "active" : "manual" })} className="rounded-2xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">Activate</button>
                    <button type="button" onClick={() => updateDomain(domain.id, { status: "rejected" })} className="rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-800">Reject</button>
                    <button type="button" onClick={() => updateDomain(domain.id, { status: "disabled", billingStatus: "cancelled" })} className="rounded-2xl bg-red-700 px-3 py-2 text-xs font-black text-white">Disable</button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
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
                </div>

                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">Stripe subscription item id
                  <input value={stripeItems[domain.id] || ""} onChange={(event) => setStripeItems((current) => ({ ...current, [domain.id]: event.target.value }))} className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#0E0E10]" placeholder="si_..." />
                </label>
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">Netlify domain alias id / note
                  <input value={netlifyAliases[domain.id] || ""} onChange={(event) => setNetlifyAliases((current) => ({ ...current, [domain.id]: event.target.value }))} className="min-h-11 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#0E0E10]" placeholder="Manual Netlify alias reference" />
                </label>
                <label className="grid gap-1 text-xs font-black uppercase tracking-[0.14em] text-[#5C5F66]">Owner notes
                  <textarea value={notes[domain.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [domain.id]: event.target.value }))} className="min-h-24 rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-[#0E0E10]" placeholder="DNS, Netlify alias, billing and approval notes." />
                </label>
                <button type="button" onClick={() => updateDomain(domain.id, { ownerNotes: notes[domain.id] || "", stripeSubscriptionItemId: stripeItems[domain.id] || "", netlifyDomainAliasId: netlifyAliases[domain.id] || "" })} disabled={savingId === domain.id} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white transition hover:bg-[#252528] disabled:cursor-wait disabled:opacity-60">
                  {savingId === domain.id ? "Saving…" : "Save owner details"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
