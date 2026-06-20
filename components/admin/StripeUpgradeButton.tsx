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

function intervalLabel(interval: BillingInterval) {
  return interval === "yearly" ? "per year" : "per month";
}

function planCardTone(isSelected: boolean) {
  return isSelected
    ? "border-[#FF6A3D] bg-[#FFF7F0] shadow-[0_18px_45px_rgba(255,106,61,0.18)] ring-2 ring-[#FF6A3D]/18"
    : "border-[#0E0E10]/10 bg-white shadow-sm hover:-translate-y-[1px] hover:border-[#FF6A3D]/35 hover:shadow-[0_14px_35px_rgba(14,14,16,0.10)]";
}

export default function StripeUpgradeButton({
  planCode,
  currencyCode,
  billingInterval = "monthly",
  label = "Continue to secure checkout",
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
    const plan = PRICING_PLANS.find((item) => item.code === selectedPlan) || PRICING_PLANS[0];
    const amount = priceForPlan(selectedPlan, selectedCurrency, selectedInterval);
    return {
      plan,
      amount,
      formatted: formatPlanPrice(amount, selectedCurrency, { forceDecimals: selectedInterval === "monthly" }),
      label: `${plan.name} · ${selectedCurrency} · ${selectedInterval}`,
    };
  }, [selectedPlan, selectedCurrency, selectedInterval]);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    setLastAttempt(null);
    const checkoutWindow = window.open("about:blank", "_blank");
    if (checkoutWindow) {
      checkoutWindow.opener = null;
      checkoutWindow.document.title = "Opening secure checkout…";
      checkoutWindow.document.body.innerHTML = `
        <main style="min-height:100vh;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:28px;background:linear-gradient(135deg,#FFF7F0 0%,#F5F2EE 55%,#FFFFFF 100%);font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#1F2328;text-align:center;">
          <section style="width:min(92vw,520px);border:1px solid rgba(14,14,16,0.10);border-radius:28px;background:rgba(255,255,255,0.94);padding:clamp(30px,8vw,54px) clamp(22px,6vw,44px);box-shadow:0 24px 70px rgba(14,14,16,0.16);">
            <div style="margin:0 auto 18px;width:56px;height:56px;border-radius:999px;background:#FF6A3D;display:flex;align-items:center;justify-content:center;color:white;font-size:26px;font-weight:900;box-shadow:0 14px 30px rgba(255,106,61,0.28);">↗</div>
            <h1 style="margin:0;font-size:clamp(26px,8vw,38px);line-height:1.08;font-weight:900;letter-spacing:-0.04em;color:#0E0E10;">Hang on while we open secure checkout</h1>
            <p style="margin:16px 0 0;font-size:clamp(16px,4.5vw,19px);line-height:1.55;font-weight:750;color:#5C5F66;">Your Orduva admin page will stay open in the other window.</p>
          </section>
        </main>
      `;
    }
    try {
      if (!checkoutWindow) {
        throw new Error("Your browser blocked the secure checkout pop-up. Please allow pop-ups for Orduva and try again.");
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
        throw new Error(data.error || "Secure checkout could not be started.");
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      checkoutWindow.location.href = data.checkoutUrl;
      setLoading(false);
    } catch (err) {
      if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.close();
      setError(err instanceof Error ? err.message : "Secure checkout could not be started.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {showControls ? (
        <div className="rounded-[24px] border border-[#0E0E10]/10 bg-[#FFF8EF] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Choose your subscription</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-[#0E0E10]">Activate this store with secure billing</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-[#5C5F66]">
                Pick the catalogue size, currency and billing frequency. Secure checkout opens in a new window, and Orduva activates the store automatically after payment.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[320px]">
              <label className="block text-xs font-black uppercase tracking-[0.16em] text-[#5C5F66]">
                Currency
                <select
                  value={selectedCurrency}
                  onChange={(event) => setSelectedCurrency(event.target.value as PricingCurrencyCode)}
                  className="mt-2 w-full rounded-2xl border border-[#0E0E10]/10 bg-white px-3 py-3 text-sm font-black normal-case tracking-normal text-[#0E0E10] outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20"
                >
                  {PRICING_CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>{currency.code}</option>
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
                    <option key={interval} value={interval}>{interval === "yearly" ? "Yearly · save 20%" : "Monthly"}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => {
              const isSelected = plan.code === selectedPlan;
              const amount = priceForPlan(plan.code, selectedCurrency, selectedInterval);
              const formatted = formatPlanPrice(amount, selectedCurrency, { forceDecimals: selectedInterval === "monthly" });
              return (
                <button
                  type="button"
                  key={plan.code}
                  onClick={() => setSelectedPlan(plan.code)}
                  className={`admin-pressable rounded-[24px] border p-4 text-left transition ${planCardTone(isSelected)}`}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-black text-[#0E0E10]">{plan.name}</p>
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#C84F2A]">{plan.productLimitLabel}</p>
                    </div>
                    {plan.highlight ? <span className="rounded-full bg-[#0E0E10] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">{plan.highlight}</span> : null}
                  </div>
                  <p className="mt-3 text-2xl font-black tracking-tight text-[#0E0E10]">{formatted}</p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-[#68707A]">{intervalLabel(selectedInterval)}</p>
                  <p className="mt-3 text-sm font-bold leading-6 text-[#5C5F66]">{plan.description}</p>
                  <span className={`mt-4 inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2 text-sm font-black ${isSelected ? "bg-[#FF6A3D] text-white" : "bg-[#F5F2EE] text-[#0E0E10]"}`}>
                    {isSelected ? "Selected" : "Select plan"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-[#FF6A3D]/15 bg-white px-4 py-3 text-sm font-bold leading-6 text-[#5C5F66]">
            Selected: <span className="font-black text-[#0E0E10]">{preview.plan.name}</span> · <span className="font-black text-[#0E0E10]">{preview.formatted}</span> {intervalLabel(selectedInterval)} · <span className="font-black text-[#0E0E10]">{selectedCurrency}</span>
            {selectedInterval === "yearly" ? <span className="ml-1 text-[#C84F2A]">Includes the yearly saving.</span> : null}
          </div>
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
        {loading ? "Opening secure checkout…" : label}
      </button>
      {lastAttempt?.checkoutUrl ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-900">
          Secure checkout opened in a new window. Complete the payment there, then return to Orduva for the updated subscription status.
        </p>
      ) : null}
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800">{error}</p> : null}
    </div>
  );
}
