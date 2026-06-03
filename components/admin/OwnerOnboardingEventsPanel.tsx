"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";

type EmailStatus = { status: string | null; label: string; recipient: string | null; eventType: string | null; createdAt: string | null; errorMessage: string | null };
type Signup = { id: string; name: string; slug: string; status: string; createdAt: string | null; storeAddress: string; storefrontUrl: string; adminLoginUrl: string; ownerName: string | null; ownerEmail: string | null; clientEmail: EmailStatus; ownerNotification: EmailStatus; emailComplete: boolean; hasIssue: boolean };
type Payload = { signups: Signup[]; summary: { totalShown: number; createdToday: number; emailComplete: number; needsAttention: number } };

function formatDate(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function statusClass(status: string | null) {
  if (status === "sent") return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
  if (status === "failed") return "bg-red-50 text-red-800 ring-1 ring-red-200";
  if (status === "skipped") return "bg-[#EAF3FB] text-[#28547D] ring-1 ring-[#8FB6D9]";
  return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}
function emailPill(label: string, status: string | null) {
  return <span className={["inline-flex min-h-8 items-center rounded-2xl px-3 py-1 text-xs font-semibold", statusClass(status)].join(" ")}>{label}</span>;
}

export default function OwnerOnboardingEventsPanel() {
  const ownerAccess = useOwnerPlatformAccess();
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const canLoad = ownerAccess.unlocked && Boolean(ownerAccess.platformKey);

  const loadEvents = useCallback(async () => {
    if (!canLoad) return;
    setLoading(true);
    setMessage("Loading recent onboarding activity...");
    try {
      const response = await fetch("/api/platform/onboarding-events", { cache: "no-store", headers: ownerAccess.platformHeaders });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Could not load recent signups.");
      setPayload(data as Payload);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load recent signups.");
    } finally {
      setLoading(false);
    }
  }, [canLoad, ownerAccess.platformHeaders]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const signups = payload?.signups || [];
  const summary = payload?.summary || { totalShown: 0, createdToday: 0, emailComplete: 0, needsAttention: 0 };
  const latest = useMemo(() => signups[0] || null, [signups]);

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#0E0E10]/10 bg-white shadow-[0_18px_50px_rgba(14,14,16,0.08)]">
      <div className="bg-gradient-to-br from-white via-[#F3F7FA] to-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#336699]">Owner event log</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0E0E10] sm:text-3xl">Recent public signups</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5C5F66]">Owner-only view of stores created through public onboarding, including client launch email and Orduva owner notification status.</p>
          </div>
          <button type="button" onClick={loadEvents} disabled={loading || !canLoad} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#252528] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Refreshing..." : "Refresh signups"}</button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[22px] border border-[#0E0E10]/10 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68707A]">Recent stores</p><p className="mt-2 text-3xl font-semibold text-[#0E0E10]">{summary.totalShown}</p></div>
          <div className="rounded-[22px] border border-[#0E0E10]/10 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68707A]">Created today</p><p className="mt-2 text-3xl font-semibold text-[#0E0E10]">{summary.createdToday}</p></div>
          <div className="rounded-[22px] border border-[#0E0E10]/10 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68707A]">Email complete</p><p className="mt-2 text-3xl font-semibold text-emerald-700">{summary.emailComplete}</p></div>
          <div className="rounded-[22px] border border-[#0E0E10]/10 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#68707A]">Needs attention</p><p className="mt-2 text-3xl font-semibold text-[#28547D]">{summary.needsAttention}</p></div>
        </div>

        {latest ? (
          <div className="mt-5 rounded-[24px] border border-[#336699]/20 bg-[#336699]/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#28547D]">Latest public signup</p>
            <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div><h3 className="text-xl font-semibold text-[#0E0E10]">{latest.name}</h3><p className="mt-1 break-all text-sm font-bold text-[#5C5F66]">{latest.storeAddress}</p><p className="mt-1 text-xs font-semibold text-[#68707A]">Created {formatDate(latest.createdAt)}</p></div>
              <div className="flex flex-col gap-2 sm:flex-row"><a href={latest.storefrontUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-white px-4 py-2 text-xs font-semibold text-[#0E0E10] transition hover:bg-[#F3F7FA]">Open store</a><a href={latest.adminLoginUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#0E0E10] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#252528]">Open admin</a></div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[#0E0E10]/10 p-5 sm:p-6">
        {message ? <p className="mb-4 rounded-2xl border border-[#336699]/20 bg-[#F3F7FA] px-4 py-3 text-sm font-bold text-[#28547D]">{message}</p> : null}
        {!loading && signups.length === 0 ? <div className="rounded-[24px] border border-dashed border-[#0E0E10]/18 bg-[#F3F7FA] p-5 text-sm leading-6 text-[#5C5F66]">No public onboarding signups are loaded yet. Create a test store from /start-your-store, then refresh this panel.</div> : null}
        <div className="space-y-3">
          {signups.map((signup) => {
            const expanded = expandedId === signup.id;
            return (
              <article key={signup.id} className="rounded-[24px] border border-[#0E0E10]/10 bg-[#FDFBF8] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-[#0E0E10]">{signup.name}</h3><span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#68707A] ring-1 ring-[#0E0E10]/10">{signup.status}</span></div><a href={signup.storefrontUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm font-bold text-[#28547D] hover:text-[#0E0E10]">{signup.storeAddress}</a><p className="mt-1 text-xs font-semibold text-[#68707A]">Created {formatDate(signup.createdAt)} · Owner {signup.ownerName || "not recorded"} · {signup.ownerEmail || "no email recorded"}</p></div>
                  <div className="flex flex-wrap gap-2">{emailPill(`Client email: ${signup.clientEmail.label}`, signup.clientEmail.status)}{emailPill(`Owner notice: ${signup.ownerNotification.label}`, signup.ownerNotification.status)}</div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap"><a href={signup.storefrontUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-xs font-semibold text-[#0E0E10] transition hover:bg-[#F3F7FA]">Open storefront</a><a href={signup.adminLoginUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-[#0E0E10] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#252528]">Open admin login</a><button type="button" onClick={() => setExpandedId(expanded ? null : signup.id)} className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-2 text-xs font-semibold text-[#0E0E10] transition hover:bg-[#F3F7FA]">{expanded ? "Hide email details" : "Email details"}</button></div>
                {expanded ? <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-2xl border border-[#0E0E10]/10 bg-white p-4 text-sm leading-6 text-[#4D535B]"><p className="font-semibold text-[#0E0E10]">Client launch email</p><p>Status: {signup.clientEmail.label}</p><p>Recipient: {signup.clientEmail.recipient || signup.ownerEmail || "not recorded"}</p><p>Logged: {formatDate(signup.clientEmail.createdAt)}</p>{signup.clientEmail.errorMessage ? <p className="font-bold text-red-700">Error: {signup.clientEmail.errorMessage}</p> : null}</div><div className="rounded-2xl border border-[#0E0E10]/10 bg-white p-4 text-sm leading-6 text-[#4D535B]"><p className="font-semibold text-[#0E0E10]">Orduva owner notification</p><p>Status: {signup.ownerNotification.label}</p><p>Recipient: {signup.ownerNotification.recipient || "not recorded"}</p><p>Logged: {formatDate(signup.ownerNotification.createdAt)}</p>{signup.ownerNotification.errorMessage ? <p className="font-bold text-red-700">Error: {signup.ownerNotification.errorMessage}</p> : null}</div></div> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
