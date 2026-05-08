"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BillingInterval,
  DEFAULT_PRICING_CURRENCY,
  PRICING_CURRENCIES,
  PRICING_PLANS,
  PricingCurrencyCode,
  formatPlanPrice,
  priceForPlan,
  suggestedCurrencyFromBrowser,
  YEARLY_DISCOUNT_PERCENT,
} from "@/lib/pricing";

type Props = {
  onboardingHref?: string;
  compact?: boolean;
};

function buildPlanHref(baseHref: string, planCode: string, currencyCode: PricingCurrencyCode, billingInterval: BillingInterval) {
  const href = baseHref || "/start-your-store";
  const [path, queryString] = href.split("?");
  const params = new URLSearchParams(queryString || "");
  if (typeof window !== "undefined") {
    const currentParams = new URLSearchParams(window.location.search);
    ["ref_tenant", "ref", "ref_source", "referralCode", "referral_code"].forEach((key) => {
      const value = currentParams.get(key);
      if (value && !params.has(key)) params.set(key, value);
    });
  }
  params.set("plan", planCode);
  params.set("currency", currencyCode);
  params.set("billing", billingInterval);
  const query = params.toString();
  return `${path}${query ? `?${query}` : ""}`;
}

export default function PricingPlans({ onboardingHref = "/start-your-store", compact = false }: Props) {
  const [currencyCode, setCurrencyCode] = useState<PricingCurrencyCode>(DEFAULT_PRICING_CURRENCY);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const explicitCurrency = params.get("currency")?.toUpperCase();
    const storedCurrency = window.localStorage.getItem("orduva_pricing_currency")?.toUpperCase();
    const detectedCurrency = suggestedCurrencyFromBrowser(window.navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone);
    const preferred = PRICING_CURRENCIES.find((currency) => currency.code === explicitCurrency)?.code || PRICING_CURRENCIES.find((currency) => currency.code === storedCurrency)?.code || detectedCurrency;
    setCurrencyCode(preferred);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("orduva_pricing_currency", currencyCode);
  }, [currencyCode]);

  const selectedCurrency = useMemo(() => PRICING_CURRENCIES.find((currency) => currency.code === currencyCode) || PRICING_CURRENCIES[0], [currencyCode]);

  return (
    <section id="pricing" className={`${compact ? "" : "border-t border-[#51372D]/12"} bg-white px-5 py-8 sm:px-7 lg:px-9 lg:py-10`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#B74A16]">Pricing plans</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#14110F] sm:text-4xl">Choose the store size that fits.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#667069] sm:text-base">
              Africa-first pricing in ZAR and KES, with GBP, USD and EUR also ready for Stripe subscriptions. Start with a 7-day trial, then upgrade when your store is ready.
            </p>
          </div>
          <div className="rounded-[26px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-3 shadow-[0_14px_34px_rgba(81,55,45,0.07)]">
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
            <div className="mt-3 grid grid-cols-2 rounded-2xl border border-[#E8D8C8] bg-white p-1">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={`min-h-10 rounded-xl px-4 py-2 text-sm font-black transition ${billingInterval === "monthly" ? "bg-[#14110F] text-white shadow-sm" : "text-[#5F625F] hover:bg-[#FFF1E6]"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("yearly")}
                className={`min-h-10 rounded-xl px-4 py-2 text-sm font-black transition ${billingInterval === "yearly" ? "bg-[#14110F] text-white shadow-sm" : "text-[#5F625F] hover:bg-[#FFF1E6]"}`}
              >
                Yearly -{YEARLY_DISCOUNT_PERCENT}%
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#667069]">Showing {selectedCurrency.label}. You can change this manually.</p>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const amount = priceForPlan(plan.code, currencyCode, billingInterval);
            return (
              <article key={plan.code} className={`relative overflow-hidden rounded-[32px] border p-5 shadow-[0_22px_58px_rgba(81,55,45,0.10)] transition hover:-translate-y-[3px] ${plan.highlight ? "border-[#F97316]/35 bg-[linear-gradient(180deg,#FFF7ED_0%,#FFFFFF_62%,#FFF8EF_100%)]" : "border-[#E8D8C8]/90 bg-white"}`}>
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
                  <li className="flex gap-2"><span className="font-black text-[#F97316]">✓</span><span>7-day free trial before paid subscription</span></li>
                  <li className="flex gap-2"><span className="font-black text-[#F97316]">✓</span><span>Customer accounts, favourites, Buy Again and admin order flow</span></li>
                </ul>
                <a
                  href={buildPlanHref(onboardingHref, plan.code, currencyCode, billingInterval)}
                  className={`mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-black shadow-sm transition hover:-translate-y-[1px] ${plan.highlight ? "bg-[#F97316] text-white hover:bg-[#EA580C]" : "bg-[#14110F] text-white hover:bg-[#2A211D]"}`}
                >
                  Start {plan.name} trial
                </a>
                <p className="mt-3 text-center text-xs text-[#667069]">Stripe checkout wiring comes next. No payment is taken today.</p>
              </article>
            );
          })}
        </div>

        <div className="mt-6 rounded-[28px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-5 text-sm leading-7 text-[#5F625F]">
          <p className="font-black text-[#14110F]">Store currency is selected during onboarding.</p>
          <p className="mt-1">That store currency will drive storefront prices, future Stripe subscription currency, and referral commission currency. Yoco and Pesapal/M-Pesa can be added after Stripe.</p>
        </div>
      </div>
    </section>
  );
}
