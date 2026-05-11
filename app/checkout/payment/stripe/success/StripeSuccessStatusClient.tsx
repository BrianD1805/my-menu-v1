"use client";

import { useEffect, useMemo, useState } from "react";

function cartKey(tenantSlug: string) {
  return `cart:${tenantSlug || "orduva"}`;
}

type CheckoutStatus = {
  paid: boolean;
  intentStatus: string | null;
  tenantSlug: string;
  storeUrl: string;
  checkoutUrl: string;
  order: null | {
    id: string;
    shortId: string;
    paymentStatus: string;
    paymentMethodLabel: string | null;
  };
};

export default function StripeSuccessStatusClient({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<CheckoutStatus | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer: number | null = null;

    async function loadStatus(nextAttempt: number) {
      try {
        const response = await fetch(`/api/storefront/stripe/checkout-status?session_id=${encodeURIComponent(sessionId)}&t=${Date.now()}`, {
          cache: "no-store",
        });
        const data = await response.json().catch(() => null) as CheckoutStatus | null;
        if (cancelled) return;
        if (response.ok && data) {
          setStatus(data);
          setAttempts(nextAttempt);
          if (data.paid && data.tenantSlug) {
            try {
              window.localStorage.removeItem(cartKey(data.tenantSlug));
              window.dispatchEvent(new CustomEvent("orduva:cart-updated", { detail: { tenantSlug: data.tenantSlug, items: [] } }));
            } catch {
              // Cart clearing is best-effort only.
            }
            return;
          }
        }
      } catch {
        if (!cancelled) setAttempts(nextAttempt);
      }

      if (!cancelled && nextAttempt < 10) {
        timer = window.setTimeout(() => void loadStatus(nextAttempt + 1), nextAttempt < 4 ? 1500 : 3000);
      }
    }

    void loadStatus(1);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [sessionId]);

  const paid = Boolean(status?.paid && status.order);
  const storeUrl = status?.storeUrl || "/";
  const checkoutUrl = status?.checkoutUrl || "/checkout";

  const confirmationCopy = useMemo(() => {
    if (paid) return "Your paid order has been created and sent to the store.";
    if (attempts >= 10) return "Stripe has received the payment, but Orduva is still waiting for the final confirmation event. The order should appear shortly. Please do not pay again unless the store asks you to.";
    return "Stripe has received the payment. Orduva is creating your paid order now. This normally takes a few seconds.";
  }, [attempts, paid]);

  return (
    <div className="px-6 py-6 sm:px-8 sm:py-8">
      <div className={`rounded-3xl border p-5 ${paid ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
        <p className="text-sm font-black uppercase tracking-[0.14em]">{paid ? "Order confirmed" : "Creating your order"}</p>
        <p className="mt-2 text-sm leading-6">{confirmationCopy}</p>
      </div>

      <dl className="mt-5 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm">
        <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">Order reference</dt><dd className="font-black text-slate-950">{status?.order?.shortId || (paid ? "Confirmed" : "Creating")}</dd></div>
        <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">Payment status</dt><dd className="font-black text-slate-950">{paid ? "Paid" : "Confirming"}</dd></div>
        <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">Payment method</dt><dd className="font-black text-slate-950">{status?.order?.paymentMethodLabel || "Stripe card payment"}</dd></div>
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a href={storeUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">Return to store</a>
        {!paid ? <a href={checkoutUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">Back to checkout</a> : null}
      </div>
    </div>
  );
}
