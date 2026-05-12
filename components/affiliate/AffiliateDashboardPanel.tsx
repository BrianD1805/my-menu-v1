"use client";

import { useCallback, useEffect, useState } from "react";

type Payload = {
  partner: { displayName: string | null; email: string | null; trackingCode: string; shareUrl: string; affiliateRewardRatePercent: number | null };
  signups: Array<{ id: string; status: string | null; created_at: string | null }>;
  credits: Array<{ id: string; paid_month: string | null; reward_amount: number | null; currency_code: string | null; credit_status: string | null; created_at: string | null }>;
  summary: { capturedSignups: number; activeRewards: number; estimatedMonthly: number; pendingAmount: number; paidAmount: number };
};

function money(amount: unknown, currency = "GBP") {
  const value = Number(amount || 0);
  try { return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value); } catch { return `${currency} ${value.toFixed(2)}`; }
}

function dateLabel(value: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AffiliateDashboardPanel() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [message, setMessage] = useState("Loading affiliate dashboard...");
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    if (typeof window === "undefined") return;
    const code = window.sessionStorage.getItem("orduva_affiliate_partner_code") || "";
    const key = window.sessionStorage.getItem("orduva_affiliate_access_key") || "";
    if (!code || !key) {
      window.location.replace("/affiliate/login");
      return;
    }
    setLoading(true);
    setMessage("Loading affiliate dashboard...");
    try {
      const response = await fetch("/api/affiliate/dashboard", { cache: "no-store", headers: { "x-orduva-affiliate-code": code, "x-orduva-affiliate-key": key } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not load affiliate dashboard.");
      setPayload(data as Payload);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load affiliate dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  async function copyShareLink() {
    if (!payload?.partner.shareUrl || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(payload.partner.shareUrl);
    setMessage("Affiliate share link copied.");
    window.setTimeout(() => setMessage(""), 1800);
  }

  function signOut() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem("orduva_affiliate_partner_code");
    window.sessionStorage.removeItem("orduva_affiliate_access_key");
    window.location.assign("/affiliate/login");
  }

  if (loading && !payload) {
    return <section className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-6 text-center shadow-[0_24px_70px_rgba(14,14,16,0.14)]"><p className="text-sm font-bold text-[#5C5F66]">{message}</p></section>;
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[34px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_28px_80px_rgba(14,14,16,0.12)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <img src="/orduva-platform-icon-192.png" alt="Orduva" className="h-14 w-14 rounded-[20px] shadow-[0_16px_36px_rgba(14,14,16,0.16)]" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6A3D]">Orduva affiliate</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0E0E10] sm:text-4xl">Welcome{payload?.partner.displayName ? `, ${payload.partner.displayName}` : ""}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button onClick={copyShareLink} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:bg-[#E95B30]">Copy share link</button>
            <button onClick={signOut} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] transition hover:bg-[#F5F2EE]">Sign out</button>
          </div>
        </div>
        <p className="mt-5 break-all rounded-2xl border border-[#FF6A3D]/20 bg-[#FFF7F0] px-4 py-3 text-sm font-bold text-[#9A3412]">{payload?.partner.shareUrl || "No link loaded"}</p>
        {message ? <p className="mt-4 rounded-2xl border border-[#FF6A3D]/25 bg-white px-4 py-3 text-sm font-bold text-[#C84F2A]">{message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[28px] border border-white/10 bg-[#0E0E10] p-5 text-white shadow-[0_20px_60px_rgba(14,14,16,0.18)]"><p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFB168]">Signups</p><p className="mt-2 text-4xl font-black">{payload?.summary.capturedSignups || 0}</p></div>
        <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-900 shadow-[0_18px_45px_rgba(14,14,16,0.08)]"><p className="text-xs font-black uppercase tracking-[0.22em]">Active</p><p className="mt-2 text-4xl font-black">{payload?.summary.activeRewards || 0}</p></div>
        <div className="rounded-[28px] border border-[#FF6A3D]/20 bg-[#FFF7F0] p-5 text-[#9A3412] shadow-[0_18px_45px_rgba(14,14,16,0.08)]"><p className="text-xs font-black uppercase tracking-[0.22em]">Pending</p><p className="mt-2 text-2xl font-black">{money(payload?.summary.pendingAmount || 0)}</p></div>
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 text-[#0E0E10] shadow-[0_18px_45px_rgba(14,14,16,0.08)]"><p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Paid</p><p className="mt-2 text-2xl font-black">{money(payload?.summary.paidAmount || 0)}</p></div>
      </div>

      <div className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_50px_rgba(14,14,16,0.08)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF6A3D]">Commission ledger</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0E0E10]">Recent affiliate credits</h2>
        <div className="mt-5 space-y-3">
          {(payload?.credits || []).map((credit) => (
            <article key={credit.id} className="flex flex-col gap-2 rounded-[22px] border border-[#0E0E10]/10 bg-[#FFFDF8] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-black text-[#0E0E10]">{dateLabel(credit.paid_month || credit.created_at)}</p><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C5F66]">{credit.credit_status || "pending"}</p></div>
              <p className="text-lg font-black text-[#0E0E10]">{money(credit.reward_amount || 0, credit.currency_code || "GBP")}</p>
            </article>
          ))}
          {!(payload?.credits || []).length ? <p className="rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#5C5F66]">No commission credits have been recorded yet.</p> : null}
        </div>
      </div>
    </section>
  );
}
