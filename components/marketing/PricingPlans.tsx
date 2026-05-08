"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BillingInterval,
  DEFAULT_PRICING_CURRENCY,
  DEFAULT_PRICING_PLAN,
  PRICING_CURRENCIES,
  PRICING_PLANS,
  PricingCurrencyCode,
  PricingPlanCode,
  formatPlanPrice,
  priceForPlan,
  suggestedCurrencyFromBrowser,
  YEARLY_DISCOUNT_PERCENT,
} from "@/lib/pricing";

type Props = {
  onboardingHref?: string;
  compact?: boolean;
  selectMode?: boolean;
  formTargetId?: string;
};

function buildPlanHref(baseHref: string, planCode: string, currencyCode: PricingCurrencyCode, billingInterval: BillingInterval) {
  const href = baseHref || "/start-your-store";
  const [path, queryString] = href.split("?");
  const params = new URLSearchParams(queryString || "");
  if (typeof window !== "undefined") {
    const currentParams = new URLSearchParams(window.location.search);
    ["ref_tenant", "ref", "ref_source", "referralCode", "referral_code"].forEach((key) => {
      const value = currentParams.get(key) || window.sessionStorage.getItem(`orduva_${key}`);
      if (value && !params.has(key)) params.set(key, value);
    });
  }
  params.set("plan", planCode);
  params.set("currency", currencyCode);
  params.set("billing", billingInterval);
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}`;
}

export default function PricingPlans({ onboardingHref = "/start-your-store", compact = false, selectMode = false, formTargetId = "store-details" }: Props) {
  const [currencyCode, setCurrencyCode] = useState<PricingCurrencyCode>(DEFAULT_PRICING_CURRENCY);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [selectedPlanCode, setSelectedPlanCode] = useState<PricingPlanCode>(DEFAULT_PRICING_PLAN);
  const [selectingPlanCode, setSelectingPlanCode] = useState<PricingPlanCode | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const explicitCurrency = params.get("currency")?.toUpperCase();
    const explicitPlan = params.get("plan")?.toLowerCase();
    const explicitBilling = params.get("billing")?.toLowerCase();
    const storedCurrency = window.localStorage.getItem("orduva_pricing_currency")?.toUpperCase();
    const detectedCurrency = suggestedCurrencyFromBrowser(window.navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone);
    const preferred = PRICING_CURRENCIES.find((currency) => currency.code === explicitCurrency)?.code || PRICING_CURRENCIES.find((currency) => currency.code === storedCurrency)?.code || detectedCurrency;
    const preferredPlan = PRICING_PLANS.find((plan) => plan.code === explicitPlan)?.code || DEFAULT_PRICING_PLAN;
    setCurrencyCode(preferred);
    setSelectedPlanCode(preferredPlan);
    if (explicitBilling === "yearly" || explicitBilling === "monthly") setBillingInterval(explicitBilling);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("orduva_pricing_currency", currencyCode);
  }, [currencyCode]);

  const selectedCurrency = useMemo(() => PRICING_CURRENCIES.find((currency) => currency.code === currencyCode) || PRICING_CURRENCIES[0], [currencyCode]);

  function updateUrlAndForm(planCode: PricingPlanCode) {
    if (typeof window === "undefined") return;
    const href = buildPlanHref(onboardingHref, planCode, currencyCode, billingInterval);
    const targetUrl = `${href}${href.includes("#") ? "" : `#${formTargetId}`}`;
    const url = new URL(targetUrl, window.location.origin);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    window.dispatchEvent(
      new CustomEvent("orduva-plan-selected", {
        detail: { planCode, currencyCode, billingInterval },
      }),
    );
  }

  function handlePlanSelect(planCode: PricingPlanCode) {
    setSelectedPlanCode(planCode);
    setSelectingPlanCode(planCode);
    updateUrlAndForm(planCode);
    window.setTimeout(() => {
      const target = document.getElementById(formTargetId);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        const firstField = target?.querySelector("input, select, textarea") as HTMLElement | null;
        firstField?.focus?.();
      }, 450);
      setSelectingPlanCode(null);
    }, 2000);
  }

  return (
    <section id="pricing" className={`${compact ? "" : "border-t border-[#51372D]/12"} bg-white px-5 py-8 sm:px-7 lg:px-9 lg:py-10`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#B74A16]">Pricing plans</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#14110F] sm:text-4xl">Select a FREE 7 day plan.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#667069] sm:text-base">
              Choose the store size you want to trial. No payment is taken today — Stripe subscription checkout is wired in the next step after your store is ready.
            </p>
          </div>
          <div className="rounded-[28px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-3 shadow-[0_14px_34px_rgba(81,55,45,0.07)]">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <label className="text-xs font-black uppercase tracking-[0.18em] text-[#8A5A38]" htmlFor="orduva-pricing-currency">Currency</label>
              <select
                id="orduva-pricing-currency"
                value={currencyCode}
                onChange={(event) => setCurrencyCode(event.target.value as PricingCurrencyCode)}
                className="min-h-11 rounded-2xl border border-[#E8D8C8] bg-white px-4 py-2 text-sm font-black text-[#14110F] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
              >
                {PRICING_CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>{currency.code} — {currency.shortLabel}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 rounded-2xl border border-[#E8D8C8] bg-white p-1 shadow-inner">
              <div className="relative grid grid-cols-2">
                <span
                  className={`absolute bottom-0 top-0 w-1/2 rounded-xl bg-[#14110F] shadow-[0_10px_24px_rgba(20,17,15,0.16)] transition-transform duration-300 ${billingInterval === "yearly" ? "translate-x-full" : "translate-x-0"}`}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setBillingInterval("monthly")}
                  className={`relative z-10 min-h-10 rounded-xl px-4 py-2 text-sm font-black transition ${billingInterval === "monthly" ? "text-white" : "text-[#5F625F] hover:text-[#14110F]"}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval("yearly")}
                  className={`relative z-10 min-h-10 rounded-xl px-4 py-2 text-sm font-black transition ${billingInterval === "yearly" ? "text-white" : "text-[#5F625F] hover:text-[#14110F]"}`}
                >
                  Yearly -{YEARLY_DISCOUNT_PERCENT}%
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#667069]">Showing {selectedCurrency.label}. You can change this manually.</p>
          </div>
        </div>

        <div className="-mx-5 mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:-mx-7 sm:px-7 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 lg:pb-0">
          {PRICING_PLANS.map((plan) => {
            const amount = priceForPlan(plan.code, currencyCode, billingInterval);
            const selected = selectedPlanCode === plan.code;
            const selecting = selectingPlanCode === plan.code;
            return (
              <article key={plan.code} className={`relative w-[calc(100vw-2.5rem)] max-w-[390px] flex-none snap-center overflow-hidden rounded-[32px] border p-5 shadow-[0_22px_58px_rgba(81,55,45,0.10)] transition hover:-translate-y-[3px] sm:w-[380px] lg:w-auto lg:max-w-none ${plan.highlight ? "border-[#F97316]/35 bg-[linear-gradient(180deg,#FFF7ED_0%,#FFFFFF_62%,#FFF8EF_100%)]" : "border-[#E8D8C8]/90 bg-white"} ${selected ? "ring-2 ring-[#F97316]/25" : ""}`}>
                {plan.highlight ? (
                  <p className="absolute right-5 top-5 rounded-full bg-[#F97316] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-sm">{plan.highlight}</p>
                ) : null}
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B74A16]">{plan.productLimitLabel}</p>
                <h3 className="mt-3 text-3xl font-black tracking-tight text-[#14110F]">{plan.name}</h3>
                <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#667069]">{plan.description}</p>
                <div className="mt-5 rounded-[24px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-4">
                  <p className="text-4xl font-black tracking-tight text-[#14110F]">{formatPlanPrice(amount, currencyCode, { forceDecimals: billingInterval === "monthly" })}</p>
                  <p className="mt-1 text-sm font-bold text-[#667069]">per {billingInterval === "yearly" ? "year" : "month"}</p>
                  {billingInterval === "yearly" ? (
                    <p className="mt-2 text-xs font-bold text-[#B74A16]">Equivalent to about {formatPlanPrice(Math.round((amount / 12) * 100) / 100, currencyCode)} / month after discount.</p>
                  ) : (
                    <p className="mt-2 text-xs font-bold text-[#B74A16]">Yearly price: {formatPlanPrice(priceForPlan(plan.code, currencyCode, "yearly"), currencyCode)} / year.</p>
                  )}
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-[#4B514C]">
                  <li className="flex gap-2"><span className="font-black text-[#F97316]">✓</span><span>{plan.productLimitLabel}</span></li>
                  <li className="flex gap-2"><span className="font-black text-[#F97316]">✓</span><span>FREE 7-day trial before paid subscription</span></li>
                  <li className="flex gap-2"><span className="font-black text-[#F97316]">✓</span><span>Customer accounts, favourites, Buy Again and admin order flow</span></li>
                </ul>
                {selectMode ? (
                  <button
                    type="button"
                    onClick={() => handlePlanSelect(plan.code)}
                    className={`mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition hover:-translate-y-[1px] ${selected ? "bg-[#F97316] text-white hover:bg-[#EA580C]" : "bg-[#14110F] text-white hover:bg-[#2A211D]"}`}
                  >
                    {selecting ? `${plan.name} Plan selected` : selected ? `${plan.name} Plan selected` : `Select ${plan.name} Plan`}
                  </button>
                ) : (
                  <a
                    href={buildPlanHref(onboardingHref, plan.code, currencyCode, billingInterval)}
                    className={`mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition hover:-translate-y-[1px] ${plan.highlight ? "bg-[#F97316] text-white hover:bg-[#EA580C]" : "bg-[#14110F] text-white hover:bg-[#2A211D]"}`}
                  >
                    Select {plan.name} Plan
                  </a>
                )}
                <p className="mt-3 text-center text-xs text-[#667069]">No payment is taken today.</p>
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-[28px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-5 text-sm leading-7 text-[#5F625F]">
          <p className="font-black text-[#14110F]">Your store currency is confirmed during onboarding.</p>
          <p className="mt-1">That store currency will drive storefront prices, future Stripe subscription currency, and referral commission currency. Yoco and Pesapal/M-Pesa can be added after Stripe.</p>
        </div>
      </div>
    </section>
  );
}
