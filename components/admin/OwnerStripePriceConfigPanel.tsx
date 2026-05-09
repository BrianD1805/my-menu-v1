"use client";

import { useEffect, useMemo, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";

type StripePriceRow = {
  planCode: string;
  planName: string;
  currencyCode: string;
  billingInterval: "monthly" | "yearly";
  envKey: string;
  priceId: string;
  configured: boolean;
  formattedAmount: string;
};

type ApiResponse = {
  total: number;
  configuredCount: number;
  missingCount: number;
  prices: StripePriceRow[];
  missing: string[];
};

const CURRENCY_ORDER = ["ZAR", "KES", "GBP", "USD", "EUR"];
const PLAN_ORDER = ["starter", "growth", "pro"];

export default function OwnerStripePriceConfigPanel() {
  const { platformHeaders } = useOwnerPlatformAccess();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/stripe-prices", {
        headers: platformHeaders,
        cache: "no-store",
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json?.error || "Could not load Stripe price configuration.");
      setData(json as ApiResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load Stripe price configuration.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformHeaders["x-orduva-platform-key"], platformHeaders["x-orduva-platform-2fa-session"]]);

  const grouped = useMemo(() => {
    const map = new Map<string, StripePriceRow[]>();
    for (const row of data?.prices || []) {
      const list = map.get(row.currencyCode) || [];
      list.push(row);
      map.set(row.currencyCode, list);
    }
    for (const [currency, rows] of map) {
      rows.sort((a, b) => {
        const planDiff = PLAN_ORDER.indexOf(a.planCode) - PLAN_ORDER.indexOf(b.planCode);
        if (planDiff) return planDiff;
        return a.billingInterval === "monthly" ? -1 : 1;
      });
      map.set(currency, rows);
    }
    return map;
  }, [data]);

  const progress = data?.total ? Math.round((data.configuredCount / data.total) * 100) : 0;

  return (
    <section className="space-y-5">
      <div className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_54px_rgba(14,14,16,0.08)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF6A3D]">Configuration status</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0E0E10]">Stripe Price IDs</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5C5F66]">
              Add these values in Netlify as secret environment variables. Stripe Price IDs usually start with <strong>price_</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white transition hover:bg-[#252528] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Checking…" : "Refresh status"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#0E0E10]/10 bg-[#FFF7F0] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5C5F66]">Configured</p>
            <p className="mt-1 text-3xl font-black text-[#0E0E10]">{data?.configuredCount ?? 0}/{data?.total ?? 30}</p>
          </div>
          <div className="rounded-2xl border border-[#FF6A3D]/20 bg-[#FF6A3D]/10 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9A3412]">Missing</p>
            <p className="mt-1 text-3xl font-black text-[#C84F2A]">{data?.missingCount ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-[#0E0E10]/10 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5C5F66]">Progress</p>
            <p className="mt-1 text-3xl font-black text-[#0E0E10]">{progress}%</p>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</p> : null}
      </div>

      {CURRENCY_ORDER.map((currency) => {
        const rows = grouped.get(currency) || [];
        if (!rows.length) return null;
        const configured = rows.filter((row) => row.configured).length;
        return (
          <article key={currency} className="overflow-hidden rounded-[30px] border border-[#0E0E10]/10 bg-white shadow-[0_18px_54px_rgba(14,14,16,0.07)]">
            <header className="flex flex-col gap-2 border-b border-[#0E0E10]/10 bg-[#FFF7F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF6A3D]">{currency}</p>
                <h3 className="mt-1 text-xl font-black text-[#0E0E10]">{configured}/6 Stripe prices configured</h3>
              </div>
              <p className="text-sm font-bold text-[#5C5F66]">Starter, Growth and Pro · monthly + yearly</p>
            </header>
            <div className="divide-y divide-[#0E0E10]/8">
              {rows.map((row) => (
                <div key={row.envKey} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.2fr_0.9fr_1.8fr_0.8fr] lg:items-center">
                  <div>
                    <p className="text-sm font-black text-[#0E0E10]">{row.planName} · {row.billingInterval}</p>
                    <p className="mt-1 text-xs font-bold text-[#5C5F66]">Expected {row.formattedAmount} / {row.billingInterval === "yearly" ? "year" : "month"}</p>
                  </div>
                  <div className="text-sm font-black text-[#0E0E10]">{row.currencyCode}</div>
                  <code className="overflow-x-auto rounded-xl border border-[#0E0E10]/10 bg-[#F5F2EE] px-3 py-2 text-xs font-bold text-[#373A3F]">{row.envKey}</code>
                  <div className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] ${row.configured ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}>
                    {row.configured ? `Set ${row.priceId}` : "Missing"}
                  </div>
                </div>
              ))}
            </div>
          </article>
        );
      })}

      <div className="rounded-[30px] border border-[#0E0E10]/10 bg-[#0E0E10] p-5 text-white shadow-[0_18px_54px_rgba(14,14,16,0.18)] sm:p-6">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFB168]">Netlify setup note</p>
        <p className="mt-3 text-sm leading-7 text-white/75">
          Add the missing variables in Netlify, mark each as a secret value, then trigger a fresh deploy. Checkout buttons will fail until the matching plan/currency/monthly-yearly Price ID exists.
        </p>
      </div>
    </section>
  );
}
