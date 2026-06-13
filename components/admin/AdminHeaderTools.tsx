"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AdminLaunchChecklist from "@/components/admin/AdminLaunchChecklist";
import StripeUpgradeButton from "@/components/admin/StripeUpgradeButton";
import BillingStatusCheck from "@/components/admin/BillingStatusCheck";
import BillingActivationJourney from "@/components/admin/BillingActivationJourney";
import type { TenantTrialState } from "@/lib/trial";

type ChecklistItem = { status?: "pending" | "complete" };
type ChecklistPayload = { items?: ChecklistItem[]; dismissed?: boolean } | null;

type ModalKind = "checklist" | "trial" | "activation" | null;

function formatTrialDate(value?: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function billingCountdown(trial?: TenantTrialState | null) {
  if (!trial) return "Billing date unavailable";
  const base = trial.trialEndsAt ? new Date(trial.trialEndsAt) : new Date();
  const due = Number.isFinite(base.getTime()) && base.getTime() > Date.now() ? base : new Date(Date.now() + 30 * 86400000);
  const ms = Math.max(0, due.getTime() - Date.now());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  return `${days} days ${hours} hours`;
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
  if (trial.isTrialExpired) return "Trial ended — activate billing";
  if (trial.trialDaysRemaining === null) return "Trial active — choose a plan when ready";
  if (trial.trialDaysRemaining === 1) return "1 day left in trial";
  return `${trial.trialDaysRemaining} days left in trial`;
}


function trialSecondaryLabel(trial?: TenantTrialState | null) {
  if (trial?.subscriptionStatus === "active" || trial?.trialStatus === "converted") return "Billing";
  return "Trial";
}

function trialModalLabel(trial?: TenantTrialState | null) {
  if (trial?.subscriptionStatus === "active" || trial?.trialStatus === "converted") return "Billing details";
  return "Trial details";
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
  const showChecklistButton = !loadingChecklist && !payload?.dismissed;

  return (
    <>
      <div className="flex shrink-0 items-stretch gap-1.5 sm:gap-2 sm:items-center sm:justify-end">
        {showChecklistButton ? (
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
        ) : null}

        <button
          type="button"
          onClick={() => {
            const shouldOpenActivation = Boolean(trialState?.isTrialExpired && trialState?.subscriptionStatus !== "active" && trialState?.trialStatus !== "converted");
            if (!shouldOpenActivation) {
              setModal("trial");
              return;
            }
            if (typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches) {
              setModal("activation");
              return;
            }
            window.location.href = "/admin/billing/activate";
          }}
          className={`admin-pressable inline-flex min-h-[48px] min-w-[64px] flex-col items-center justify-center rounded-[20px] border px-2.5 py-2 shadow-[0_12px_28px_rgba(0,0,0,0.10)] transition hover:-translate-y-[1px] sm:min-h-[60px] sm:min-w-[90px] ${trialTone(trialState)}`}
          aria-label={trialState?.isTrialExpired ? "Open billing activation" : "Open trial details"}
        >
          <span className="text-sm font-black leading-none sm:text-base">{trialShortLabel(trialState)}</span>
          <span className="mt-1 text-[10px] font-black uppercase tracking-[0.15em] opacity-75 sm:text-[11px]">{trialSecondaryLabel(trialState)}</span>
        </button>
      </div>

      {mounted && modal
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex min-h-[100dvh] items-center justify-center bg-[#0E0E10]/55 px-[35px] py-[75px] backdrop-blur-[3px]"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className="absolute inset-0 h-full w-full cursor-default"
                onClick={() => setModal(null)}
                aria-label="Close popup backdrop"
              />
              {modal === "activation" ? (
                <section className="relative mx-auto flex max-h-[calc(100dvh-1.25rem)] w-full max-w-[430px] flex-col overflow-hidden rounded-[30px] border border-white/20 bg-[#F7F2EA] text-[#1F2328] shadow-[0_28px_80px_rgba(14,14,16,0.30)] sm:hidden">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="admin-pressable absolute right-3 top-3 z-20 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0E0E10] text-2xl font-light leading-none text-white shadow-[0_12px_26px_rgba(14,14,16,0.25)] transition hover:bg-[#252528]"
                    aria-label="Close billing activation"
                  >
                    ×
                  </button>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    <BillingActivationJourney mode="popup" />
                  </div>
                </section>
              ) : (
              <section className="relative mx-auto flex max-h-[calc(100dvh-150px)] w-full max-w-[760px] flex-col overflow-hidden rounded-[30px] border border-emerald-900/10 bg-[#F7FAF8] text-[#1F2328] shadow-[0_28px_80px_rgba(14,14,16,0.30)] before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-gradient-to-r before:from-emerald-900 before:via-emerald-600 before:to-teal-400">
                <div className="sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-b border-emerald-900/10 bg-[#F7FAF8]/95 px-5 py-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] backdrop-blur sm:px-7">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-800">{modal === "checklist" ? "Admin checklist" : trialModalLabel(trialState)}</p>
                    <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#0E0E10] sm:text-2xl">
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
                    <div className="rounded-[26px] border border-emerald-900/10 bg-white p-5 text-[#1F2328] sm:p-6">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#0E0E10]/10">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#68707A]">Status</p>
                          <p className="mt-2 text-base font-semibold text-[#0E0E10]">{trialStatusText(trialState)}</p>
                        </div>
                        <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#0E0E10]/10">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#68707A]">{trialState?.isSubscriptionActive ? "Billing" : "Trial ends"}</p>
                          <p className="mt-2 text-base font-semibold text-[#0E0E10]">{trialState?.isSubscriptionActive ? "Open billing below" : formatTrialDate(trialState?.trialEndsAt)}</p>
                        </div>
                        <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#0E0E10]/10">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#68707A]">Plan</p>
                          <p className="mt-2 text-base font-semibold text-[#0E0E10]">{trialState?.planName || "orduva_trial"}</p>
                        </div>
                      </div>
                      {trialState?.isSubscriptionActive ? (
                        <div className="mt-5 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-950">
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-800">Next payment countdown</p>
                          <p className="mt-2 text-2xl font-semibold tracking-tight">{billingCountdown(trialState)}</p>
                          <p className="mt-1 text-sm leading-6 text-emerald-900/75">Estimated time remaining before the next subscription payment is due.</p>
                        </div>
                      ) : null}
                      {trialState?.isTrialExpired ? (
                        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-800">
                          The trial has ended and customer checkout is paused. Choose a paid plan below to reactivate the store immediately after Stripe confirms payment.
                        </p>
                      ) : trialState?.isSubscriptionActive ? (
                        <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-900">
                          Subscription billing is active and the storefront remains open.
                        </p>
                      ) : (
                        <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-900">
                          The store remains open during the trial. When you are ready, choose a paid plan below and Stripe will activate billing securely.
                        </p>
                      )}
                      {trialState?.subscriptionStatus === "active" || trialState?.trialStatus === "converted" ? null : (
                        <div className="mt-5 rounded-[26px] border border-[#FF6A3D]/20 bg-white p-4 shadow-sm sm:p-5">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-[#0E0E10]/10 bg-[#FFF7F0] px-4 py-3">
                              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C84F2A]">Step 1</p>
                              <p className="mt-1 text-sm font-black text-[#0E0E10]">Choose a plan</p>
                            </div>
                            <div className="rounded-2xl border border-[#0E0E10]/10 bg-[#FFF7F0] px-4 py-3">
                              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C84F2A]">Step 2</p>
                              <p className="mt-1 text-sm font-black text-[#0E0E10]">Pay securely</p>
                            </div>
                            <div className="rounded-2xl border border-[#0E0E10]/10 bg-[#FFF7F0] px-4 py-3">
                              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C84F2A]">Step 3</p>
                              <p className="mt-1 text-sm font-black text-[#0E0E10]">Store becomes active</p>
                            </div>
                          </div>
                          <div className="mt-5">
                            <StripeUpgradeButton label="Continue to secure checkout" showControls />
                          </div>
                        </div>
                      )}
                      <BillingStatusCheck />
                    </div>
                  )}
                </div>
              </section>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
