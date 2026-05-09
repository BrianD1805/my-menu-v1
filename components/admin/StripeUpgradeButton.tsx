"use client";

import { useMemo, useState } from "react";
import {
  BillingInterval,
  PricingCurrencyCode,
  PricingPlanCode,
  PRICING_CURRENCIES,
  PRICING_PLANS,
  formatPlanPrice,
  priceForPlan,
} from "@/lib/pricing";

type CheckoutResponse = {
  checkoutUrl?: string;
  sessionId?: string;
  planCode?: PricingPlanCode;
  currencyCode?: PricingCurrencyCode;
  billingInterval?: BillingInterval;
  priceEnvKey?: string;
  priceId?: string;
  formattedAmount?: string;
  error?: string;
};

const INTERVALS: BillingInterval[] = ["monthly", "yearly"];

function normalisePlan(value?: PricingPlanCode | null): PricingPlanCode {
  return PRICING_PLANS.some((plan) => plan.code === value) ? (value as PricingPlanCode) : "starter";
}

function normaliseCurrency(value?: PricingCurrencyCode | null): PricingCurrencyCode {
  return PRICING_CURRENCIES.some((currency) => currency.code === value) ? (value as PricingCurrencyCode) : "ZAR";
}

function normaliseInterval(value?: BillingInterval | null): BillingInterval {
  return value === "yearly" ? "yearly" : "monthly";
}

export default function StripeUpgradeButton({
  planCode,
  currencyCode,
  billingInterval = "monthly",
  label = "Upgrade with Stripe",
  className,
  showControls = false,
}: {
  planCode?: PricingPlanCode | null;
  currencyCode?: PricingCurrencyCode | null;
  billingInterval?: BillingInterval;
  label?: string;
  className?: string;
  showControls?: boolean;
}) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlanCode>(normalisePlan(planCode));
  const [selectedCurrency, setSelectedCurrency] = useState<PricingCurrencyCode>(normaliseCurrency(currencyCode));
  const [selectedInterval, setSelectedInterval] = useState<BillingInterval>(normaliseInterval(billingInterval));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<CheckoutResponse | null>(null);

  const effectivePlan = showControls ? selectedPlan : planCode;
  const effectiveCurrency = showControls ? selectedCurrency : currencyCode;
  const effectiveInterval = showControls ? selectedInterval : billingInterval;

  const preview = useMemo(() => {
    const amount = priceForPlan(selectedPlan, selectedCurrency, selectedInterval);
    return {
      amount,
      formatted: formatPlanPrice(amount, selectedCurrency, { forceDecimals: selectedInterval === "monthly" }),
      label: `${selectedPlan} · ${selectedCurrency} · ${selectedInterval}`,
    };
  }, [selectedPlan, selectedCurrency, selectedInterval]);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    setLastAttempt(null);
    const checkoutWindow = window.open("about:blank", "_blank");
    if (checkoutWindow) {
      checkoutWindow.opener = null;
      checkoutWindow.document.title = "Opening Stripe Checkout…";
      checkoutWindow.document.body.innerHTML = '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:32px;line-height:1.5;color:#1F2328"><strong>Opening secure Stripe Checkout…</strong><br />You can return to Orduva in the original tab.</div>';
    }
    try {
      if (!checkoutWindow) {
        throw new Error("Your browser blocked the Stripe checkout pop-up. Please allow pop-ups for Orduva and try again.");
      }
      const response = await fetch("/api/billing/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-orduva-request-id": `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ planCode: effectivePlan, currencyCode: effectiveCurrency, billingInterval: effectiveInterval }),
      });
      const data = (await response.json().catch(() => ({}))) as CheckoutResponse;
      setLastAttempt(data);
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Stripe checkout could not be started.");
      }
      checkoutWindow.location.href = data.checkoutUrl;
      setLoading(false);
    } catch (err) {
      if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.close();
      setError(err instanceof Error ? err.message : "Stripe checkout could not be started.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {showControls ? (
        <div className="rounded-[22px] border border-[#0E0E10]/10 bg-[#FFF8EF] p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#5C5F66]">
              Plan
              <select
                value={selectedPlan}
                onChange={(event) => setSelectedPlan(event.target.value as PricingPlanCode)}
                className="mt-2 w-full rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-3 text-sm font-black normal-case tracking-normal text-[#0E0E10] outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20"
              >
                {PRICING_PLANS.map((plan) => (
                  <option key={plan.code} value={plan.code}>{plan.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#5C5F66]">
              Currency
              <select
                value={selectedCurrency}
                onChange={(event) => setSelectedCurrency(event.target.value as PricingCurrencyCode)}
                className="mt-2 w-full rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-3 text-sm font-black normal-case tracking-normal text-[#0E0E10] outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20"
              >
                {PRICING_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>{currency.code} · {currency.shortLabel}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#5C5F66]">
              Billing
              <select
                value={selectedInterval}
                onChange={(event) => setSelectedInterval(event.target.value as BillingInterval)}
                className="mt-2 w-full rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-3 text-sm font-black normal-case tracking-normal text-[#0E0E10] outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20"
              >
                {INTERVALS.map((interval) => (
                  <option key={interval} value={interval}>{interval === "yearly" ? "Yearly" : "Monthly"}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="mt-3 rounded-2xl border border-[#FF6A3D]/15 bg-white px-4 py-3 text-sm font-bold leading-6 text-[#5C5F66]">
            Test selection: <span className="font-black text-[#0E0E10]">{preview.formatted}</span> / {selectedInterval === "yearly" ? "year" : "month"}. Stripe will open in a new window; cancel returns to Orduva without taking payment.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={startCheckout}
        disabled={loading}
        className={
          className ||
          "admin-pressable inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:-translate-y-[1px] hover:bg-[#E85C32] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
        }
      >
        {loading ? "Opening secure Stripe Checkout…" : label}
      </button>
      {lastAttempt?.priceEnvKey ? (
        <p className="rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3 text-xs font-bold leading-5 text-[#5C5F66]">
          Last checkout attempt used <code className="font-black text-[#0E0E10]">{lastAttempt.priceEnvKey}</code>{lastAttempt.formattedAmount ? ` · ${lastAttempt.formattedAmount}` : ""}.
        </p>
      ) : null}
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800">{error}</p> : null}
    </div>
  );
}
