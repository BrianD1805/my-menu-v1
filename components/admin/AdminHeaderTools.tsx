"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AdminLaunchChecklist from "@/components/admin/AdminLaunchChecklist";
import StripeUpgradeButton from "@/components/admin/StripeUpgradeButton";
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
  if (!trial) return "border-[#0E0E10]/10 bg-[#F8FAFC] text-[#0E0E10]";
  if (trial.subscriptionStatus === "active" || trial.trialStatus === "converted") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (trial.isTrialExpired) return "border-red-200 bg-red-50 text-red-900";
  if ((trial.trialDaysRemaining ?? 99) <= 2) return "border-[#FFB168]/55 bg-[#FFF7F0] text-[#C84F2A]";
  return "border-emerald-200 bg-emerald-50 text-emerald-900";
}

export default function AdminHeaderTools({ tenantSlug, trialState }: { tenantSlug?: string | null; trialState?: TenantTrialState | null }) {
  const [payload, setPayload] = useState<ChecklistPayload>(null);
  const [loadingChecklist, setLoadingChecklist] = useState(true);
  const [modal, setModal] = useState<ModalKind>(null);
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
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
          className="admin-pressable inline-flex min-h-[48px] min-w-[64px] flex-col items-center justify-center rounded-[18px] border border-[#0E0E10]/10 bg-[#FFF7F0] px-2.5 py-2 text-[#0E0E10] shadow-sm transition hover:-translate-y-[1px] hover:border-[#FF6A3D]/35 hover:bg-white sm:min-h-[60px] sm:min-w-[90px]"
          aria-label="Open launch checklist"
        >
          <span className="text-sm font-black leading-none text-[#C84F2A] sm:text-base">
            {loadingChecklist ? "…" : `${checklistSummary.completed}/${checklistSummary.total}`}
          </span>
          <span className="mt-1 text-[10px] font-black uppercase tracking-[0.15em] text-[#5C5F66] sm:text-[11px]">Checklist</span>
        </button>

        <button
          type="button"
          onClick={() => setModal("trial")}
          className={`admin-pressable inline-flex min-h-[48px] min-w-[64px] flex-col items-center justify-center rounded-[20px] border px-2.5 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.10)] transition hover:-translate-y-[1px] sm:min-h-[60px] sm:min-w-[90px] ${trialTone(trialState)}`}
          aria-label="Open trial details"
        >
          <span className="text-sm font-black leading-none sm:text-base">{trialShortLabel(trialState)}</span>
          <span className="mt-1 text-[10px] font-black uppercase tracking-[0.15em] opacity-75 sm:text-[11px]">Trial</span>
        </button>
      </div>

      {mounted && modal
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex min-h-[100dvh] items-center justify-center bg-[#0E0E10]/58 p-4 backdrop-blur-md sm:p-8"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="absolute inset-0 h-full w-full cursor-default"
                onClick={() => setModal(null)}
                aria-label="Close popup backdrop"
              />
              <section className="relative mx-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-[920px] flex-col overflow-hidden rounded-[30px] border border-white/20 bg-white text-[#1F2328] shadow-[0_28px_80px_rgba(14,14,16,0.30)] sm:max-h-[calc(100dvh-4rem)]">
                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#0E0E10]/10 px-5 py-4 sm:px-7 sm:py-5">
                  <div className="min-w-0">
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

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
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
                          Checkout is currently paused because the trial has expired. Upgrade with Stripe or ask the platform owner to add more trial days to re-enable checkout.
                        </p>
                      ) : (
                        <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-900">
                          Storefront checkout remains available while the trial or subscription is active.
                        </p>
                      )}
                      {trialState?.subscriptionStatus === "active" || trialState?.trialStatus === "converted" ? null : (
                        <div className="mt-5 rounded-[24px] border border-[#FF6A3D]/20 bg-white p-4 shadow-sm">
                          <p className="text-sm font-black text-[#0E0E10]">Ready to activate this store?</p>
                          <p className="mt-1 text-sm leading-6 text-[#5C5F66]">
                            Stripe checkout uses this tenant’s saved plan and storefront currency. Webhook automation will complete the automatic subscription updates in the next phase.
                          </p>
                          <div className="mt-4">
                            <StripeUpgradeButton label="Upgrade with Stripe" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
