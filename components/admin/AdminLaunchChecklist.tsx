"use client";

import { useEffect, useMemo, useState } from "react";
import AdminInstallCard from "@/components/admin/AdminInstallCard";
import AdminPushNotificationsCard from "@/components/admin/AdminPushNotificationsCard";

type ChecklistItem = {
  key: string;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
  auto: boolean;
  status: "pending" | "complete";
  autoComplete?: boolean;
  manualComplete?: boolean;
  completedAt?: string | null;
};

type ChecklistPayload = {
  tenant: { slug: string; name: string; storefrontUrl: string };
  collapsed: boolean;
  dismissed: boolean;
  items: ChecklistItem[];
  diagnostics?: Record<string, number | boolean>;
};

const FALLBACK_ITEMS: ChecklistItem[] = [
  {
    key: "signin",
    title: "Sign in to admin",
    body: "Sign in first, then Orduva will save and update your launch progress automatically.",
    actionLabel: "Sign in below",
    actionHref: "#login",
    auto: true,
    status: "pending",
  },
  {
    key: "categories_added",
    title: "Add your first category",
    body: "Once you are signed in, click this to open Categories and add your first menu or catalogue section.",
    actionLabel: "Open categories",
    actionHref: "/admin/categories",
    auto: true,
    status: "pending",
  },
  {
    key: "products_added",
    title: "Add your first product",
    body: "Products and prices are what turn the new store into something customers can use.",
    actionLabel: "Open products",
    actionHref: "/admin/products",
    auto: true,
    status: "pending",
  },
];

function statusBadge(isDone: boolean, autoComplete?: boolean) {
  if (isDone && autoComplete) return "Auto-ticked";
  if (isDone) return "Done";
  return "Next step";
}

function progressMessage(percentage: number) {
  if (percentage >= 100) return "Everything is ticked. The store owner can hide this checklist when they are happy to launch.";
  if (percentage >= 75) return "You are almost ready. Just finish the last few checks before sharing the store.";
  if (percentage >= 45) return "Good progress. Keep going through the practical setup steps one at a time.";
  if (percentage > 0) return "A few essentials are done. The next tasks will shape the store for customers.";
  return "Start with categories and products. The checklist will tick items automatically where it can.";
}

function actionHint(item: ChecklistItem, isDone: boolean) {
  if (isDone) return item.autoComplete ? "Detected and saved automatically." : "Marked done and saved for this store.";
  if (item.auto) return "This will tick automatically after Orduva detects the change.";
  return "Tick this manually once you have checked it.";
}

export default function AdminLaunchChecklist({
  tenantSlug,
  showSetupTools = false,
}: {
  tenantSlug?: string;
  showSetupTools?: boolean;
}) {
  const storefrontUrl = useMemo(() => {
    const slug = String(tenantSlug || "").trim().toLowerCase();
    return slug ? `https://${slug}.orduva.com` : "/";
  }, [tenantSlug]);

  const [payload, setPayload] = useState<ChecklistPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [error, setError] = useState("");

  async function loadChecklist() {
    try {
      setError("");
      const response = await fetch("/api/admin/launch-checklist", { cache: "no-store" });
      if (response.status === 401) {
        setPayload(null);
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not load launch checklist");
      setPayload(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load launch checklist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChecklist();
    const refresh = () => loadChecklist();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  async function save(checklistKey: string, complete: boolean) {
    setSavingKey(checklistKey);
    try {
      const response = await fetch("/api/admin/launch-checklist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklistKey, status: complete ? "complete" : "pending" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not save checklist progress");
      await loadChecklist();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save checklist progress");
    } finally {
      setSavingKey(null);
    }
  }

  function openAction(item: ChecklistItem) {
    if (item.actionHref === "storefront") {
      window.open(payload?.tenant?.storefrontUrl || storefrontUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (item.actionHref.includes("#setup-tools")) {
      setShowTools(true);
      if (window.location.pathname === "/admin") {
        window.setTimeout(() => document.getElementById("setup-tools")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
        return;
      }
    }

    if (item.actionHref.startsWith("/admin/settings")) {
      window.location.href = item.actionHref;
      return;
    }

    window.location.href = item.actionHref;
  }

  const items = payload?.items?.length ? payload.items : FALLBACK_ITEMS;
  const completed = items.filter((item) => item.status === "complete").length;
  const percentage = items.length ? Math.round((completed / items.length) * 100) : 0;
  const isAuthenticated = Boolean(payload);
  const calmProgressMessage = progressMessage(percentage);
  const collapsed = Boolean(payload?.collapsed);
  const dismissed = Boolean(payload?.dismissed);

  if (dismissed) {
    return (
      <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-4 shadow-[0_14px_38px_rgba(14,14,16,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Launch checklist complete</p>
            <p className="mt-1 text-sm leading-6 text-emerald-900">
              The checklist is hidden because the store owner marked the launch setup as done.
            </p>
          </div>
          <button
            type="button"
            onClick={() => save("__dismissed", false)}
            disabled={savingKey === "__dismissed"}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            Show checklist again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="launch-checklist" className="rounded-[32px] border border-[#FFD8C8] bg-[linear-gradient(135deg,#ffffff_0%,#fff7f0_56%,#ffe7db_100%)] p-5 shadow-[0_20px_58px_rgba(14,14,16,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C84F2A]">Interactive launch checklist</p>
          <h2 className="mt-2 text-2xl font-black text-[#0E0E10] sm:text-3xl">Finish your launch setup</h2>
          <p className="mt-3 text-sm leading-6 text-[#5C5F66]">
            Click a task to open the right admin area. Orduva will tick the practical steps automatically where it can, and saves the progress for this store.
          </p>
          <p className="mt-3 rounded-2xl border border-[#FFD8C8] bg-white/78 px-4 py-3 text-sm font-bold text-[#7A4B37]">
            {calmProgressMessage}
          </p>
          {!isAuthenticated && !loading ? (
            <p className="mt-3 rounded-2xl border border-[#FFD8C8] bg-white/78 px-4 py-3 text-sm font-semibold text-[#7A4B37]">
              Sign in first to save checklist progress across devices.
            </p>
          ) : null}
          {error ? <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p> : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <div className="rounded-[24px] border border-[#0E0E10]/10 bg-white px-5 py-4 text-center shadow-sm">
            <p className="text-3xl font-black text-[#0E0E10]">{loading ? "…" : `${percentage}%`}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Launch progress</p>
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => save("__collapsed", !collapsed)}
              disabled={savingKey === "__collapsed"}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-[#FFF7F0] disabled:opacity-60"
            >
              {collapsed ? "Maximise checklist" : "Minimise checklist"}
            </button>
          ) : null}
        </div>
      </div>

      {collapsed ? (
        <div className="mt-5 rounded-[24px] border border-[#0E0E10]/10 bg-white/82 p-4 text-sm leading-6 text-[#5C5F66]">
          Checklist minimised. Progress is saved for this store. {calmProgressMessage}
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {items.map((item, index) => {
              const isDone = item.status === "complete";
              const canManualToggle = isAuthenticated && !item.autoComplete;
              return (
                <div
                  key={item.key}
                  className={`rounded-[24px] border p-4 transition ${
                    isDone ? "border-emerald-200 bg-emerald-50" : "border-[#0E0E10]/10 bg-white/88 hover:border-[#FF6A3D]/35"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${isDone ? "bg-emerald-600 text-white" : "bg-[#FFF7F0] text-[#C84F2A] ring-1 ring-[#FFD8C8]"}`}>
                      {isDone ? "✓" : index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Step {index + 1}</span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${isDone ? "bg-emerald-100 text-emerald-800" : "bg-[#FFF7F0] text-[#7A4B37]"}`}>
                          {statusBadge(isDone, item.autoComplete)}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-black text-[#0E0E10]">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[#5C5F66]">{item.body}</p>
                      <p className="mt-2 text-xs font-bold text-[#7A4B37]">{actionHint(item, isDone)}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openAction(item)}
                          className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#0E0E10] px-4 py-2 text-xs font-black text-white transition hover:bg-[#252528]"
                        >
                          {item.actionLabel}
                        </button>
                        {canManualToggle ? (
                          <button
                            type="button"
                            onClick={() => save(item.key, !isDone)}
                            disabled={savingKey === item.key}
                            className={`inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2 text-xs font-black transition disabled:opacity-60 ${
                              isDone
                                ? "bg-white text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"
                                : "bg-[#FF6A3D] text-white hover:bg-[#E95C32]"
                            }`}
                          >
                            {savingKey === item.key ? "Saving..." : isDone ? "Untick" : "Mark done"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {showSetupTools ? (
            <div id="setup-tools" className="mt-5 rounded-[26px] border border-[#0E0E10]/10 bg-white/80 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C84F2A]">Optional setup tools</p>
                  <h3 className="mt-1 text-xl font-black text-[#0E0E10]">Phone install and order alert setup</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5C5F66]">
                    These tools support the checklist, but stay tucked away until the store owner is ready for them.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTools((current) => !current)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white transition hover:bg-[#252528]"
                >
                  {showTools ? "Hide setup tools" : "Open setup tools"}
                </button>
              </div>
              {showTools ? (
                <div className="mt-5 space-y-5">
                  <AdminInstallCard />
                  <AdminPushNotificationsCard />
                </div>
              ) : null}
            </div>
          ) : null}

          {isAuthenticated && percentage >= 100 ? (
            <div className="mt-5 rounded-[26px] border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Ready to launch</p>
                  <h3 className="mt-1 text-xl font-black text-emerald-950">Everything is ticked off</h3>
                  <p className="mt-2 text-sm leading-6 text-emerald-900">
                    Hide the checklist only when the store owner is happy that setup is complete.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => save("__dismissed", true)}
                  disabled={savingKey === "__dismissed"}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  Everything is done — hide checklist
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
