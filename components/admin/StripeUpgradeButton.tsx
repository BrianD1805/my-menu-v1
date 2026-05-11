"use client";

import { useState } from "react";
import type { BillingInterval, PricingCurrencyCode, PricingPlanCode } from "@/lib/pricing";

export default function StripeUpgradeButton({
  planCode,
  currencyCode,
  billingInterval = "monthly",
  label = "Upgrade with Stripe",
  className,
}: {
  planCode?: PricingPlanCode | null;
  currencyCode?: PricingCurrencyCode | null;
  billingInterval?: BillingInterval;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/billing/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-orduva-request-id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ planCode, currencyCode, billingInterval }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Stripe checkout could not be started.");
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stripe checkout could not be started.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={
          className ||
          "admin-pressable inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:-translate-y-[1px] hover:bg-[#E85C32] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        }
      >
        {loading ? "Opening Stripe…" : label}
      </button>
      {error ? <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800">{error}</p> : null}
    </div>
  );
}
