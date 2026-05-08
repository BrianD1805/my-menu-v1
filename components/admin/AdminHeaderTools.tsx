"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLaunchChecklist from "@/components/admin/AdminLaunchChecklist";
import type { TenantTrialState } from "@/lib/trial";

type ChecklistItem = { status?: "pending" | "complete" };
type ChecklistPayload = { items?: ChecklistItem[]; dismissed?: boolean } | null;

type ModalKind = "checklist" | "trial" | null;

function formatTrialDate(value?: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function trialShortLabel(trial?: TenantTrialState | null) {
  if (!trial) return "Trial";
  if (trial.subscriptionStatus === "active" || trial.trialStatus === "converted") return "Active";
  if (trial.isTrialExpired) return "Expired";
  if (trial.trialDaysRemaining === null) return "Trial";
  if (trial.trialDaysRemaining === 1) return "1 day";
  return `${trial.trialDaysRemaining} days`;
}

function trialStatusText(trial?: TenantTrialState | null) {
  if (!trial) return "Trial details are unavailable.";
  if (trial.subscriptionStatus === "active" || trial.trialStatus === "converted") return "Subscription active";
  if (trial.isTrialExpired) return "Trial expired — checkout paused";
  if (trial.trialDaysRemaining === null) return "Trial active";
  if (trial.trialDaysRemaining === 1) return "1 day left in trial";
  return `${trial.trialDaysRemaining} days left in trial`;
}

function trialTone(trial?: TenantTrialState | null) {
  if (!trial) return "border-white/15 bg-white/10 text-white";
  if (trial.subscriptionStatus === "active" || trial.trialStatus === "converted") return "border-emerald-300/35 bg-emerald-400/16 text-emerald-50";
  if (trial.isTrialExpired) return "border-red-300/35 bg-red-400/18 text-red-50";
  if ((trial.trialDaysRemaining ?? 99) <= 2) return "border-[#FFB168]/45 bg-[#FF6A3D]/24 text-white";
  return "border-emerald-300/35 bg-emerald-400/16 text-emerald-50";
}

export default function AdminHeaderTools({ tenantSlug, trialState }: { tenantSlug?: string | null; trialState?: TenantTrialState | null }) {
  const [payload, setPayload] = useState<ChecklistPayload>(null);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [modal, setModal] = useState<ModalKind>(null);

  async function loadChecklistSummary() {
    try {
      setLoadingChecklist(true);
      const response = await fetch("/api/admin/launch-checklist", { cache: "no-store", credentials: "same-origin" });
      if (!response.ok) {
        setPayload(null);
        return;
      }
      const data = await response.json();
      setPayload(data);
    } catch {
      setPayload(null);
    } finally {
      setLoadingChecklist(false);
    }
  }

  useEffect(() => {
    loadChecklistSummary();
    const refresh = () => loadChecklistSummary();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  useEffect(() => {
    if (!modal) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
      loadChecklistSummary();
    };
  }, [modal]);

  const checklistSummary = useMemo(() => {
    const items = payload?.items || [];
    const total = items.length || 9;
    const completed = items.filter((item) => item.status === "complete").length;
    return { completed, total };
  }, [payload]);

  return (
    <>
      <div className="flex shrink-0 items-stretch gap-1.5 sm:gap-2 sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => setModal("checklist")}
          className="admin-pressable inline-flex min-h-[52px] min-w-[66px] flex-col items-center justify-center rounded-[20px] border border-white/15 bg-white/10 px-2.5 py-2 text-white shadow-[0_12px_28px_rgba(0,0,0,0.10)] transition hover:-translate-y-[1px] hover:bg-white/16 sm:min-h-[64px] sm:min-w-[90px]"
          aria-label="Open launch checklist"
        >
          <span className="text-sm font-black leading-none text-[#FFB168] sm:text-base">
            {loadingChecklist ? "…" : `${checklistSummary.completed}/${checklistSummary.total}`}
          </span>
          <span className="mt-1 text-[10px] font-black uppercase tracking-[0.15em] text-white/78 sm:text-[11px]">Checklist</span>
        </button>

        <button
          type="button"
          onClick={() => setModal("trial")}
          className={`admin-pressable inline-flex min-h-[52px] min-w-[66px] flex-col items-center justify-center rounded-[20px] border px-2.5 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.10)] transition hover:-translate-y-[1px] sm:min-h-[64px] sm:min-w-[90px] ${trialTone(trialState)}`}
          aria-label="Open trial details"
        >
          <span className="text-sm font-black leading-none sm:text-base">{trialShortLabel(trialState)}</span>
          <span className="mt-1 text-[10px] font-black uppercase tracking-[0.15em] opacity-75 sm:text-[11px]">Trial</span>
        </button>
      </div>

      {modal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0E0E10]/58 p-4 backdrop-blur-md sm:p-6" role="dialog" aria-modal="true">
          <div className="absolute inset-0" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/18 bg-white shadow-[0_28px_80px_rgba(14,14,16,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#0E0E10]/10 px-5 py-4 sm:px-7 sm:py-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#C84F2A]">{modal === "checklist" ? "Admin checklist" : "Trial details"}</p>
                <h2 className="mt-1 text-xl font-black tracking-tight text-[#0E0E10] sm:text-2xl">
                  {modal === "checklist" ? "Launch checklist" : trialStatusText(trialState)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="admin-pressable inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0E0E10] text-2xl font-light leading-none text-white transition hover:bg-[#252528]"
                aria-label="Close popup"
              >
                ×
              </button>
            </div>

            <div className="max-h-[calc(100vh-9.5rem)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
              {modal === "checklist" ? (
                <AdminLaunchChecklist tenantSlug={tenantSlug || undefined} showSetupTools />
              ) : (
                <div className="rounded-[26px] border border-[#0E0E10]/10 bg-[#F8FAFC] p-5 text-[#1F2328] sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#0E0E10]/10">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#68707A]">Status</p>
                      <p className="mt-2 text-lg font-black text-[#0E0E10]">{trialStatusText(trialState)}</p>
                    </div>
                    <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#0E0E10]/10">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#68707A]">Trial ends</p>
                      <p className="mt-2 text-lg font-black text-[#0E0E10]">{formatTrialDate(trialState?.trialEndsAt)}</p>
                    </div>
                    <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#0E0E10]/10">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#68707A]">Plan</p>
                      <p className="mt-2 text-lg font-black text-[#0E0E10]">{trialState?.planName || "orduva_trial"}</p>
                    </div>
                  </div>
                  {trialState?.isTrialExpired ? (
                    <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800">
                      Checkout is currently paused because the trial has expired. Upgrade or ask the platform owner to add more trial days to re-enable checkout.
                    </p>
                  ) : (
                    <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-900">
                      Storefront checkout remains available while the trial or subscription is active.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
