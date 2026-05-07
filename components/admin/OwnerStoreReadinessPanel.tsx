"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";

type ReadinessCheck = { key: string; label: string; ready: boolean; important: boolean; detail: string | null };
type TrialState = { trialStatus: string; subscriptionStatus: string; planName: string; trialStartedAt: string | null; trialEndsAt: string | null; trialDaysTotal: number; trialDaysRemaining: number | null; isTrialActive: boolean; isTrialExpired: boolean };
type StoreReadiness = { id: string; name: string; slug: string; status: string; createdAt: string | null; trial: TrialState; storeAddress: string; storefrontUrl: string; adminLoginUrl: string; readiness: { score: number; label: string; tone: string; readyCount: number; totalChecks: number; blockingIssues: number }; counts: { categories: number; products: number; activeProducts: number; productPhotos: number; adminPushDevices: number; orders: number; emailSent: number; emailFailed: number }; checks: ReadinessCheck[] };
type Payload = { stores: StoreReadiness[]; summary: { totalStores: number; readyStores: number; nearlyReadyStores: number; needsSetupStores: number; missingProducts: number; missingAdminPush: number; trialActiveStores: number; trialExpiringStores: number; trialExpiredStores: number } };

function toneClasses(tone: string) {
  if (tone === "ready") return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  if (tone === "attention") return "bg-amber-50 text-amber-900 ring-1 ring-amber-200";
  return "bg-red-50 text-red-800 ring-1 ring-red-200";
}

function trialPillClasses(trial: TrialState) {
  if (trial.subscriptionStatus === "active" || trial.trialStatus === "converted") return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  if (trial.isTrialExpired) return "bg-red-50 text-red-800 ring-1 ring-red-200";
  if ((trial.trialDaysRemaining ?? 99) <= 2) return "bg-[#FFF7F0] text-[#9A3412] ring-1 ring-[#FF6A3D]/25";
  return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
}
function trialLabel(trial: TrialState) {
  if (trial.subscriptionStatus === "active" || trial.trialStatus === "converted") return "Subscription active";
  if (trial.isTrialExpired) return "Trial expired";
  if (trial.trialDaysRemaining === null) return "Trial active";
  if (trial.trialDaysRemaining === 1) return "1 trial day left";
  return `${trial.trialDaysRemaining} trial days left`;
}

function checkClasses(ready: boolean, important: boolean) {
  if (ready) return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (important) return "border-red-200 bg-red-50 text-red-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}
function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function OwnerStoreReadinessPanel() {
  const ownerAccess = useOwnerPlatformAccess();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [extendBusyId, setExtendBusyId] = useState<string | null>(null);
  const canLoad = ownerAccess.unlocked && Boolean(ownerAccess.platformKey);

  const loadReadiness = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setMessage("Loading store readiness checks...");
    try {
      const response = await fetch("/api/platform/store-readiness", { cache: "no-store", headers: { "x-orduva-platform-key": ownerAccess.platformKey } });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not load store readiness.");
      setPayload(data as Payload);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load store readiness.");
    } finally {
      setLoading(false);
    }
  }, [canLoad, ownerAccess.platformKey]);

  useEffect(() => { loadReadiness(); }, [loadReadiness]);

  async function extendTrial(tenantId: string, additionalDays = 7) {
    if (!ownerAccess.platformKey) return;
    setExtendBusyId(tenantId);
    setMessage(`Adding ${additionalDays} trial day${additionalDays === 1 ? "" : "s"}...`);
    try {
      const response = await fetch("/api/platform/trials/extend", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-orduva-platform-key": ownerAccess.platformKey },
        body: JSON.stringify({ tenantId, additionalDays }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not extend trial.");
      setMessage(`Trial extended by ${additionalDays} day${additionalDays === 1 ? "" : "s"}.`);
      await loadReadiness();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not extend trial.");
    } finally {
      setExtendBusyId(null);
    }
  }

  const stores = payload?.stores || [];
  const summary = payload?.summary || { totalStores: 0, readyStores: 0, nearlyReadyStores: 0, needsSetupStores: 0, missingProducts: 0, missingAdminPush: 0, trialActiveStores: 0, trialExpiringStores: 0, trialExpiredStores: 0 };
  const priorityStore = useMemo(() => stores.find((store) => store.readiness.label !== "Ready") || stores[0] || null, [stores]);

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#0E0E10]/10 bg-white shadow-[0_18px_50px_rgba(14,14,16,0.08)]">
      <div className="bg-gradient-to-br from-[#0E0E10] via-[#1B1B1F] to-[#332019] p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFB168]">Owner readiness dashboard</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Store readiness checklist</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72">Visual owner-only launch checks for each onboarded store, so you can quickly see which stores are ready and which still need setup before sharing.</p>
          </div>
          <button type="button" onClick={loadReadiness} disabled={loading || !canLoad} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-[#FFF7F0] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Refreshing..." : "Refresh readiness"}</button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[22px] border border-white/10 bg-white/10 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-white/62">Stores checked</p><p className="mt-2 text-3xl font-black">{summary.totalStores}</p></div>
          <div className="rounded-[22px] border border-emerald-300/30 bg-emerald-400/10 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">Ready</p><p className="mt-2 text-3xl font-black">{summary.readyStores}</p></div>
          <div className="rounded-[22px] border border-[#FFB168]/30 bg-[#FFB168]/10 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFE1C7]">Nearly ready</p><p className="mt-2 text-3xl font-black">{summary.nearlyReadyStores}</p></div>
          <div className="rounded-[22px] border border-red-300/30 bg-red-400/10 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-red-100">Needs setup</p><p className="mt-2 text-3xl font-black">{summary.needsSetupStores}</p></div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-emerald-300/25 bg-emerald-400/10 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">Active trials</p><p className="mt-2 text-2xl font-black">{summary.trialActiveStores}</p></div>
          <div className="rounded-[22px] border border-[#FFB168]/35 bg-[#FFB168]/10 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFE1C7]">Expiring soon</p><p className="mt-2 text-2xl font-black">{summary.trialExpiringStores}</p></div>
          <div className="rounded-[22px] border border-red-300/30 bg-red-400/10 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-red-100">Expired trials</p><p className="mt-2 text-2xl font-black">{summary.trialExpiredStores}</p></div>
        </div>
        {priorityStore ? <div className="mt-5 rounded-[24px] border border-white/10 bg-white/10 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB168]">Priority check</p><div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h3 className="text-xl font-black">{priorityStore.name}</h3><p className="mt-1 break-all text-sm font-bold text-white/74">{priorityStore.storeAddress}</p><p className="mt-1 text-xs font-semibold text-white/58">{priorityStore.readiness.readyCount} of {priorityStore.readiness.totalChecks} checks complete · {trialLabel(priorityStore.trial)} · Created {formatDate(priorityStore.createdAt)}</p></div><span className={["inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2 text-xs font-black", toneClasses(priorityStore.readiness.tone)].join(" ")}>{priorityStore.readiness.label} · {priorityStore.readiness.score}%</span></div></div> : null}
      </div>
      <div className="border-t border-[#0E0E10]/10 p-5 sm:p-6">
        {message ? <p className="mb-4 rounded-2xl border border-[#FF6A3D]/20 bg-[#FFF7F0] px-4 py-3 text-sm font-bold text-[#C84F2A]">{message}</p> : null}
        {!loading && stores.length === 0 ? <div className="rounded-[24px] border border-dashed border-[#0E0E10]/18 bg-[#FFF7F0] p-5 text-sm leading-6 text-[#5C5F66]">No stores are loaded yet. Create a store from public onboarding, then refresh this panel.</div> : null}
        <div className="space-y-4">
          {stores.map((store) => {
            const expanded = expandedId === store.id;
            return (
              <article key={store.id} className="rounded-[26px] border border-[#0E0E10]/10 bg-[#FDFBF8] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black text-[#0E0E10]">{store.name}</h3><span className={["rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]", toneClasses(store.readiness.tone)].join(" ")}>{store.readiness.label}</span><span className={["rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em]", trialPillClasses(store.trial)].join(" ")}>{trialLabel(store.trial)}</span></div><a href={store.storefrontUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm font-bold text-[#C84F2A] hover:text-[#0E0E10]">{store.storeAddress}</a><p className="mt-1 text-xs font-semibold text-[#68707A]">{store.readiness.readyCount} of {store.readiness.totalChecks} checks complete · {store.readiness.blockingIssues} key issue(s) · Ends {formatDate(store.trial.trialEndsAt)}</p></div>
                  <div className="min-w-[160px]"><div className="h-3 overflow-hidden rounded-full bg-[#0E0E10]/10"><div className="h-full rounded-full bg-[#FF6A3D]" style={{ width: `${Math.max(4, Math.min(100, store.readiness.score))}%` }} /></div><p className="mt-2 text-right text-xs font-black text-[#0E0E10]">{store.readiness.score}% ready</p></div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{store.checks.slice(0, 5).map((check) => <div key={check.key} className={["rounded-2xl border px-3 py-2 text-xs font-bold", checkClasses(check.ready, check.important)].join(" ")}>{check.ready ? "✓" : check.important ? "!" : "•"} {check.label}</div>)}</div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap"><a href={store.storefrontUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-xs font-black text-[#0E0E10] transition hover:bg-[#FFF7F0]">Open storefront</a><a href={store.adminLoginUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#0E0E10] px-4 py-2 text-xs font-black text-white transition hover:bg-[#252528]">Open admin login</a><button type="button" onClick={() => void extendTrial(store.id, 7)} disabled={extendBusyId === store.id} className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#FF6A3D]/25 bg-[#FFF7F0] px-4 py-2 text-xs font-black text-[#9A3412] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">{extendBusyId === store.id ? "Adding days..." : "+7 trial days"}</button><button type="button" onClick={() => void extendTrial(store.id, 1)} disabled={extendBusyId === store.id} className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-xs font-black text-[#0E0E10] transition hover:bg-[#FFF7F0] disabled:cursor-not-allowed disabled:opacity-60">+1 day</button><button type="button" onClick={() => setExpandedId(expanded ? null : store.id)} className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-xs font-black text-[#0E0E10] transition hover:bg-[#FFF7F0]">{expanded ? "Hide full checklist" : "Full checklist"}</button></div>
                {expanded ? <div className="mt-4 grid gap-3 md:grid-cols-2">{store.checks.map((check) => <div key={check.key} className={["rounded-2xl border p-4 text-sm", checkClasses(check.ready, check.important)].join(" ")}><div className="flex items-start justify-between gap-3"><div><p className="font-black">{check.label}</p><p className="mt-1 text-xs font-semibold opacity-80">{check.detail || "No detail recorded"}</p></div><span className="text-lg font-black">{check.ready ? "✓" : check.important ? "!" : "•"}</span></div></div>)}</div> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
