"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";
import { affiliatePayoutCurrencyLabel, buildAffiliateShareUrl } from "@/lib/affiliates";

type Application = {
  id: string;
  applicant_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  payout_currency_code: string | null;
  earning_region: string | null;
  earning_region_other: string | null;
  website_url: string | null;
  audience_notes: string | null;
  promotion_plan: string | null;
  ref_tenant_slug: string | null;
  referring_tenant_id: string | null;
  status: string | null;
  created_at: string | null;
};

type Partner = {
  id: string;
  application_id: string | null;
  display_name: string | null;
  email: string | null;
  tracking_code: string | null;
  access_key?: string | null;
  payout_currency_code: string | null;
  earning_region: string | null;
  earning_region_other: string | null;
  status: string | null;
  affiliate_reward_rate_percent: number | null;
  referring_tenant_id: string | null;
  referring_tenant_slug: string | null;
  tenant_reward_rate_percent: number | null;
  created_at: string | null;
};

type Tenant = { id: string; name: string | null; slug: string | null };

type Payload = { applications: Application[]; partners: Partner[]; tenants: Tenant[] };

function dateLabel(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function statusClass(status: string | null) {
  const clean = String(status || "pending").toLowerCase();
  if (clean === "approved" || clean === "active") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (clean === "declined" || clean === "cancelled") return "bg-red-50 text-red-800 ring-red-200";
  if (clean === "paused") return "bg-orange-50 text-orange-800 ring-orange-200";
  return "bg-[#FFF7F0] text-[#9A3412] ring-[#FF6A3D]/25";
}

export default function OwnerAffiliateApplicationsPanel() {
  const ownerAccess = useOwnerPlatformAccess();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [lastApproved, setLastApproved] = useState<{ shareUrl: string; accessKey: string; trackingCode: string } | null>(null);
  const canLoad = ownerAccess.unlocked && Boolean(ownerAccess.platformKey);

  const tenantById = useMemo(() => new Map((payload?.tenants || []).map((tenant) => [tenant.id, tenant])), [payload?.tenants]);
  const pendingApplications = (payload?.applications || []).filter((app) => String(app.status || "pending") === "pending");
  const decidedApplications = (payload?.applications || []).filter((app) => String(app.status || "pending") !== "pending");

  const loadAffiliates = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setMessage("Loading affiliate applications...");
    try {
      const response = await fetch("/api/platform/affiliates", { cache: "no-store", headers: ownerAccess.platformHeaders });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not load affiliates.");
      setPayload(data as Payload);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load affiliates.");
    } finally {
      setLoading(false);
    }
  }, [canLoad, ownerAccess.platformHeaders]);

  useEffect(() => { void loadAffiliates(); }, [loadAffiliates]);

  async function updateAffiliate(body: Record<string, unknown>, busyKey: string) {
    setBusyId(busyKey);
    setMessage("Saving affiliate update...");
    setLastApproved(null);
    try {
      const response = await fetch("/api/platform/affiliates", {
        method: "PATCH",
        headers: { ...ownerAccess.platformHeaders, "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not save affiliate update.");
      if (data?.partner?.tracking_code) {
        setLastApproved({ shareUrl: data.partner.shareUrl || buildAffiliateShareUrl(data.partner.tracking_code), accessKey: data.partner.access_key || "", trackingCode: data.partner.tracking_code });
      }
      await loadAffiliates();
      setMessage("Affiliate update saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save affiliate update.");
    } finally {
      setBusyId(null);
    }
  }

  if (!canLoad) {
    return (
      <section className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-6 shadow-[0_18px_50px_rgba(14,14,16,0.08)]">
        <p className="text-sm font-bold text-[#5C5F66]">Unlock the owner platform to manage affiliate applications.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] border border-white/10 bg-[#0E0E10] p-5 text-white shadow-[0_20px_60px_rgba(14,14,16,0.18)]">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFB168]">Pending</p>
          <p className="mt-2 text-4xl font-black">{pendingApplications.length}</p>
          <p className="mt-1 text-sm text-white/65">Applications waiting for owner approval</p>
        </div>
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-[0_18px_45px_rgba(14,14,16,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.22em]">Approved partners</p>
          <p className="mt-2 text-4xl font-black">{(payload?.partners || []).length}</p>
          <p className="mt-1 text-sm text-emerald-800/75">Separate affiliate links and dashboard logins</p>
        </div>
        <div className="rounded-[28px] border border-[#FF6A3D]/20 bg-[#FFF7F0] p-5 text-[#9A3412] shadow-[0_18px_45px_rgba(14,14,16,0.08)]">
          <p className="text-xs font-black uppercase tracking-[0.22em]">Rates</p>
          <p className="mt-2 text-2xl font-black">10% + 5%</p>
          <p className="mt-1 text-sm">Affiliate commission + referring tenant commission</p>
        </div>
      </div>

      {message ? <p className="rounded-2xl border border-[#FF6A3D]/25 bg-white px-4 py-3 text-sm font-bold text-[#C84F2A]">{message}</p> : null}
      {lastApproved ? (
        <div className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="text-sm font-black">Affiliate approved</p>
          <p className="mt-2 break-all text-sm"><strong>Share link:</strong> {lastApproved.shareUrl}</p>
          <p className="mt-1 break-all text-sm"><strong>Login key:</strong> {lastApproved.accessKey}</p>
        </div>
      ) : null}

      <div className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_50px_rgba(14,14,16,0.08)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF6A3D]">Applications</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0E0E10]">Pending affiliate applicants</h2>
          </div>
          <button onClick={() => void loadAffiliates()} disabled={loading} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] transition hover:bg-[#F5F2EE] disabled:opacity-60">Refresh</button>
        </div>

        <div className="mt-5 space-y-4">
          {pendingApplications.length ? pendingApplications.map((application) => {
            const tenant = application.referring_tenant_id ? tenantById.get(application.referring_tenant_id) : null;
            return (
              <article key={application.id} className="rounded-[24px] border border-[#0E0E10]/10 bg-[#FFFDF8] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black text-[#0E0E10]">{application.applicant_name || "Applicant"}</h3>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ring-1 ${statusClass(application.status)}`}>{application.status || "pending"}</span>
                    </div>
                    <p className="mt-1 text-sm font-bold text-[#5C5F66]">{application.email}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-[#9A3412]">Applied {dateLabel(application.created_at)}</p>
                    <p className="mt-2 text-sm text-[#5C5F66]"><strong>Payout currency:</strong> {affiliatePayoutCurrencyLabel(application.payout_currency_code || application.country || "GBP")}</p>
                    <p className="mt-1 text-sm text-[#5C5F66]"><strong>Target earning region:</strong> {application.earning_region || "Not supplied"}{application.earning_region_other ? ` — ${application.earning_region_other}` : ""}</p>
                    {tenant ? <p className="mt-2 text-sm text-[#5C5F66]">Introduced by tenant: <strong>{tenant.name || tenant.slug}</strong></p> : application.ref_tenant_slug ? <p className="mt-2 text-sm text-[#5C5F66]">Tenant source: <strong>{application.ref_tenant_slug}</strong></p> : null}
                    <p className="mt-3 text-sm leading-6 text-[#5C5F66]"><strong>Audience:</strong> {application.audience_notes}</p>
                    <p className="mt-2 text-sm leading-6 text-[#5C5F66]"><strong>Promotion plan:</strong> {application.promotion_plan}</p>
                    {application.website_url ? <p className="mt-2 break-all text-sm text-[#5C5F66]"><strong>Website/social:</strong> {application.website_url}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    <button onClick={() => updateAffiliate({ action: "approve", applicationId: application.id }, application.id)} disabled={busyId === application.id} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:bg-[#E95B30] disabled:opacity-60">Approve</button>
                    <button onClick={() => updateAffiliate({ action: "decline", applicationId: application.id }, `${application.id}-decline`)} disabled={busyId === `${application.id}-decline`} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] transition hover:bg-[#F5F2EE] disabled:opacity-60">Decline</button>
                  </div>
                </div>
              </article>
            );
          }) : <p className="rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#5C5F66]">No pending affiliate applications.</p>}
        </div>
      </div>

      <div className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_50px_rgba(14,14,16,0.08)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF6A3D]">Approved partners</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0E0E10]">Affiliate links and login keys</h2>
        <div className="mt-5 space-y-3">
          {(payload?.partners || []).map((partner) => (
            <article key={partner.id} className="rounded-[24px] border border-[#0E0E10]/10 bg-[#FFFDF8] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-[#0E0E10]">{partner.display_name || partner.email}</h3>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] ring-1 ${statusClass(partner.status)}`}>{partner.status || "active"}</span>
                  </div>
                  <p className="mt-1 break-all text-sm text-[#5C5F66]">{buildAffiliateShareUrl(partner.tracking_code || "")}</p>
                  <p className="mt-1 text-sm text-[#5C5F66]">Affiliate {partner.affiliate_reward_rate_percent ?? 10}% · Tenant {partner.tenant_reward_rate_percent ?? 5}% {partner.referring_tenant_slug ? `· Tenant source ${partner.referring_tenant_slug}` : ""}</p>
                  <p className="mt-1 text-sm text-[#5C5F66]">Payout: <strong>{affiliatePayoutCurrencyLabel(partner.payout_currency_code || "GBP")}</strong>{partner.earning_region ? ` · Target: ${partner.earning_region}` : ""}</p>
                  {partner.access_key ? <p className="mt-1 break-all text-xs font-bold uppercase tracking-[0.12em] text-[#9A3412]">Login key: {partner.access_key}</p> : null}
                </div>
                <div className="flex gap-2">
                  {String(partner.status) !== "active" ? <button onClick={() => updateAffiliate({ action: "partner-status", partnerId: partner.id, status: "active" }, `${partner.id}-active`)} className="rounded-2xl bg-[#0E0E10] px-4 py-2 text-sm font-bold text-white">Activate</button> : null}
                  {String(partner.status) === "active" ? <button onClick={() => updateAffiliate({ action: "partner-status", partnerId: partner.id, status: "paused" }, `${partner.id}-paused`)} className="rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-sm font-bold text-[#0E0E10]">Pause</button> : null}
                </div>
              </div>
            </article>
          ))}
          {!(payload?.partners || []).length ? <p className="rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#5C5F66]">No approved affiliate partners yet.</p> : null}
        </div>
      </div>
    </section>
  );
}
