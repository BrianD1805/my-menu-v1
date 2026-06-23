"use client";

import { useEffect, useState } from "react";

type StatusPayload = {
  checkoutId: string | null;
  transactionReference: string | null;
  transactionId: string | null;
  status: string;
  paid: boolean;
  orderId: string | null;
  checkoutUrl: string;
  storeUrl?: string;
  tenantSlug?: string;
  error?: string;
};

function cartKey(tenantSlug: string) {
  return `cart:${tenantSlug || "orduva"}`;
}

function clearAllOrduvaCarts() {
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("cart:")) {
        const keySlug = key.slice("cart:".length) || "orduva";
        window.localStorage.removeItem(key);
        window.dispatchEvent(new CustomEvent("orduva:cart-updated", { detail: { tenantSlug: keySlug, items: [] } }));
      }
    }
  } catch {
    // Cart clearing is best-effort only.
  }
}

function clearTenantCart(tenantSlug: string) {
  if (!tenantSlug) {
    clearAllOrduvaCarts();
    return;
  }
  try {
    window.localStorage.removeItem(cartKey(tenantSlug));
    window.dispatchEvent(new CustomEvent("orduva:cart-updated", { detail: { tenantSlug, items: [] } }));
    clearAllOrduvaCarts();
  } catch {
    // Cart clearing is best-effort only.
  }
}

export default function OzowSuccessStatusClient({ checkoutId }: { checkoutId: string }) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    async function loadStatus(attempt = 0) {
      setLoading(true);
      const params = new URLSearchParams();
      if (checkoutId) params.set("checkout_id", checkoutId);
      params.set("t", String(Date.now()));

      try {
        const response = await fetch(`/api/storefront/ozow/checkout-status?${params.toString()}`, { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!cancelled) {
          setStatus(data);
          if (data?.paid) clearTenantCart(String(data?.tenantSlug || ""));
        }

        if (!cancelled && !data?.paid && attempt < 8) {
          timer = window.setTimeout(() => void loadStatus(attempt + 1), attempt < 3 ? 1500 : 3500);
        }
      } catch {
        if (!cancelled) setStatus({ checkoutId, transactionReference: null, transactionId: null, status: "checking", paid: false, orderId: null, checkoutUrl: "/checkout", error: "Still checking Ozow payment status." });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [checkoutId]);

  const paid = Boolean(status?.paid);
  const storeUrl = status?.storeUrl || "/";
  const checkoutUrl = status?.checkoutUrl || "/checkout";

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-xl rounded-[32px] border border-emerald-100 bg-white p-6 text-center sm:p-8">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {paid ? "✓" : "…"}
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-emerald-700">Ozow payment</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          {paid ? "Payment received" : loading ? "Confirming payment" : "Payment is being checked"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {paid
            ? "Your Ozow payment has been confirmed and the order has been sent to the store."
            : "Ozow has returned you to Orduva. We are checking the payment confirmation before creating the order. Please do not pay again."}
        </p>
        {status?.transactionReference ? <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700">Reference: {status.transactionReference}</p> : null}
        {status?.error ? <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{status.error}</p> : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {!paid ? <a href={checkoutUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">Back to checkout</a> : null}
          <a href={storeUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">Back to store</a>
        </div>
      </section>
    </main>
  );
}
