"use client";

import { useEffect, useState } from "react";

type StatusPayload = {
  checkoutId: string | null;
  merchantRequestId: string | null;
  checkoutRequestId: string | null;
  accountReference?: string | null;
  phoneNumber?: string | null;
  status: string;
  paid: boolean;
  orderId: string | null;
  checkoutUrl: string;
  storeUrl?: string;
  tenantSlug?: string;
  message?: string | null;
  error?: string;
};

function cartKey(tenantSlug: string) {
  return `cart:${tenantSlug || "orduva"}`;
}

function clearTenantCart(tenantSlug: string) {
  if (!tenantSlug) return;
  try {
    window.localStorage.removeItem(cartKey(tenantSlug));
    window.dispatchEvent(new CustomEvent("orduva:cart-updated", { detail: { tenantSlug, items: [] } }));
  } catch {
    // Cart clearing is best-effort only.
  }
}

export default function DarajaSuccessStatusClient({ checkoutId, checkoutRequestId, merchantRequestId }: { checkoutId: string; checkoutRequestId: string; merchantRequestId: string }) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    async function loadStatus(attempt = 0) {
      setLoading(true);
      const params = new URLSearchParams();
      if (checkoutId) params.set("checkout_id", checkoutId);
      if (checkoutRequestId) params.set("CheckoutRequestID", checkoutRequestId);
      if (merchantRequestId) params.set("MerchantRequestID", merchantRequestId);
      params.set("t", String(Date.now()));

      try {
        const response = await fetch(`/api/storefront/daraja/checkout-status?${params.toString()}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!cancelled) {
          setStatus(data);
          if (data?.paid && data?.tenantSlug) clearTenantCart(String(data.tenantSlug));
        }

        if (!cancelled && !data?.paid && attempt < 8) {
          timer = window.setTimeout(() => void loadStatus(attempt + 1), attempt < 3 ? 1800 : 3500);
        }
      } catch {
        if (!cancelled) setStatus({ checkoutId, checkoutRequestId, merchantRequestId, status: "checking", paid: false, orderId: null, checkoutUrl: "/checkout", error: "Still checking direct M-Pesa payment status." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [checkoutId, checkoutRequestId, merchantRequestId]);

  const paid = Boolean(status?.paid);
  const storeUrl = status?.storeUrl || "/";
  const checkoutUrl = status?.checkoutUrl || "/checkout";

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-xl rounded-[32px] border border-emerald-100 bg-white p-6 text-center sm:p-8">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {paid ? "✓" : "…"}
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">Direct M-Pesa</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          {paid ? "Payment received" : loading ? "Check your phone" : "M-Pesa prompt sent"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {paid
            ? "Your M-Pesa payment has been confirmed and the order has been sent to the store."
            : "We have sent the Safaricom STK Push request. Please check your phone and enter your M-Pesa PIN. In this foundation build, the order will not be created until the Daraja callback/reconciliation build is added."}
        </p>
        {status?.checkoutRequestId ? <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700">CheckoutRequestID: {status.checkoutRequestId}</p> : null}
        {status?.message ? <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">{status.message}</p> : null}
        {status?.error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{status.error}</p> : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {!paid ? <a href={checkoutUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">Back to checkout</a> : null}
          <a href={storeUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">Back to store</a>
        </div>
      </section>
    </main>
  );
}
