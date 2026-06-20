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
import { LIVE_VERSION } from "@/lib/version";

type CheckoutResponse = {
  checkoutUrl?: string;
  error?: string;
  selected?: {
    planCode?: string;
    currencyCode?: string;
    billingInterval?: string;
    priceId?: string;
  };
};

type Props = {
  mode?: "page" | "popup";
};

function intervalLabel(interval: BillingInterval) {
  return interval === "yearly" ? "per year" : "per month";
}

function planButtonText(planName: string, selected: boolean, loading: boolean) {
  if (loading && selected) return "Opening secure checkout…";
  if (selected) return `Continue with ${planName}`;
  return `Select ${planName} Plan`;
}

export default function BillingActivationJourney({ mode = "page" }: Props) {
  const [currencyCode, setCurrencyCode] = useState<PricingCurrencyCode>(DEFAULT_PRICING_CURRENCY);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [selectedPlanCode, setSelectedPlanCode] = useState<PricingPlanCode>(DEFAULT_PRICING_PLAN);
  const [loadingPlan, setLoadingPlan] = useState<PricingPlanCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

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

  async function startCheckout(planCode: PricingPlanCode) {
    setSelectedPlanCode(planCode);
    setLoadingPlan(planCode);
    setError(null);
    setOpened(false);

    const checkoutWindow = window.open("about:blank", "_blank");
    if (checkoutWindow) {
      checkoutWindow.opener = null;
      checkoutWindow.document.title = "Opening secure checkout…";
      checkoutWindow.document.body.innerHTML = '<div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:32px;line-height:1.5;color:#1F2328"><strong>Opening secure checkout…</strong><br />You can return to Orduva in the original tab.</div>';
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
        body: JSON.stringify({ planCode, currencyCode, billingInterval }),
      });
      const data = (await response.json().catch(() => ({}))) as CheckoutResponse;
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Secure checkout could not be started.");
      }
      checkoutWindow.location.href = data.checkoutUrl;
      setOpened(true);
    } catch (err) {
      if (checkoutWindow && !checkoutWindow.closed) checkoutWindow.close();
      setError(err instanceof Error ? err.message : "Secure checkout could not be started.");
    } finally {
      setLoadingPlan(null);
    }
  }

  const shellClass = mode === "popup" ? "bg-[#F7F2EA] text-[#1F2328]" : "min-h-screen overflow-hidden bg-[#F7F2EA] text-[#1F2328]";
  const outerPadding = mode === "popup" ? "px-0 py-0" : "px-4 py-5 sm:px-6 lg:px-8";
  const cardClass = mode === "popup"
    ? "mx-auto overflow-hidden rounded-[30px] border border-white/90 bg-[#FFFDF8]/[0.94] shadow-none backdrop-blur-xl"
    : "mx-auto max-w-7xl overflow-hidden rounded-[38px] border border-white/90 bg-[#FFFDF8]/[0.9] shadow-[0_34px_100px_rgba(39,31,27,0.16)] backdrop-blur-xl";

  return (
    <main className={shellClass}>
      <section className={`relative isolate overflow-hidden ${outerPadding}`}>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_8%,rgba(255,111,28,0.20),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(81,55,45,0.14),transparent_30%),radial-gradient(circle_at_55%_88%,rgba(255,181,112,0.20),transparent_34%),linear-gradient(135deg,#FFF8EF_0%,#EEE4D7_48%,#F8FAF7_100%)]" />
        <div className="absolute -right-28 top-24 -z-10 h-72 w-72 rounded-full bg-[#FF7A1A]/18 blur-3xl" />
        <div className="absolute -left-28 bottom-8 -z-10 h-72 w-72 rounded-full bg-[#51372D]/12 blur-3xl" />

        <div className={cardClass}>
          <header className="border-b border-[#51372D]/12 px-5 py-5 sm:px-7 lg:px-9">
            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
              <div className="text-center lg:text-left">
                <p className="text-xl font-black tracking-tight text-[#14110F]">Orduva</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-[#F97316]">Online ordering platform</p>
              </div>
              <div className="flex justify-center">
                <img
                  src="/orduva-logo-hero-updated.png"
                  alt="Orduva — Don't order it, ORDUVA it!"
                  className="h-auto w-full max-w-[340px] object-contain sm:max-w-[450px] lg:max-w-[500px]"
                />
              </div>
              <div className="hidden lg:block" aria-hidden="true" />
            </div>
          </header>

          <section className="px-5 py-8 text-center sm:px-7 lg:px-9 lg:py-10">
            <div className="mx-auto max-w-4xl">
              <p className="mx-auto inline-flex w-fit rounded-full border border-[#F97316]/25 bg-[#FFF1E6] px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#B74A16]">
                Activate your store
              </p>
              <h1 className="mt-6 text-[2.2rem] font-black leading-[1] tracking-tight text-[#14110F] sm:text-[3.3rem] lg:text-[4.1rem]">
                Choose your paid plan.
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#5F625F] sm:text-lg">
                Select the catalogue size, currency and billing frequency that fits this business. Payment is handled securely, and Orduva reactivates the store automatically once billing is confirmed.
              </p>
            </div>
          </section>

          <section className="border-t border-[#51372D]/12 bg-white/76 px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
            <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
              <div className="rounded-[26px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-5 shadow-[0_14px_34px_rgba(81,55,45,0.07)]">
                <p className="text-sm font-black text-[#14110F]">Secure billing</p>
                <p className="mt-2 text-sm leading-6 text-[#667069]">Choose a monthly or yearly subscription and complete payment through secure checkout.</p>
              </div>
              <div className="rounded-[26px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-5 shadow-[0_14px_34px_rgba(81,55,45,0.07)]">
                <p className="text-sm font-black text-[#14110F]">Store activation</p>
                <p className="mt-2 text-sm leading-6 text-[#667069]">Once payment is confirmed, Orduva updates the store to active and customer checkout opens again.</p>
              </div>
              <div className="rounded-[26px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-5 shadow-[0_14px_34px_rgba(81,55,45,0.07)]">
                <p className="text-sm font-black text-[#14110F]">Manage subscription online</p>
                <p className="mt-2 text-sm leading-6 text-[#667069]">After activation, billing status, renewal dates and safe cancellation controls stay inside the admin area.</p>
              </div>
            </div>
          </section>

          <section id="pricing" className="bg-white px-4 py-7 sm:px-7 lg:px-9 lg:py-10">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#B74A16]">Billing plans</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#14110F] sm:text-4xl">Select a paid plan.</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-[#667069] sm:text-base">
                    Choose the store size, currency and billing frequency. Payment is taken securely today.
                  </p>
                </div>
                <div className="rounded-[28px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-3 shadow-[0_14px_34px_rgba(81,55,45,0.07)]">
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                    <label className="text-xs font-black uppercase tracking-[0.18em] text-[#8A5A38]" htmlFor="orduva-billing-currency">Currency</label>
                    <select
                      id="orduva-billing-currency"
                      value={currencyCode}
                      onChange={(event) => setCurrencyCode(event.target.value as PricingCurrencyCode)}
                      className="min-h-11 rounded-2xl border border-[#E8D8C8] bg-white px-4 py-2 text-sm font-black text-[#14110F] outline-none transition focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/15"
                    >
                      {PRICING_CURRENCIES.map((currency) => (
                        <option key={currency.code} value={currency.code}>{currency.code}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={billingInterval === "yearly"}
                      onClick={() => setBillingInterval((current) => (current === "monthly" ? "yearly" : "monthly"))}
                      className="group relative flex min-h-12 w-full items-center justify-between overflow-hidden rounded-full border border-[#E8D8C8] bg-white p-1.5 text-sm font-black shadow-inner transition focus:outline-none focus:ring-2 focus:ring-[#F97316]/20"
                    >
                      <span
                        className={`absolute bottom-1.5 top-1.5 w-[calc(50%-6px)] rounded-full bg-[#14110F] shadow-[0_10px_24px_rgba(20,17,15,0.16)] transition-transform duration-300 ease-out ${billingInterval === "yearly" ? "translate-x-[calc(100%+6px)]" : "translate-x-0"}`}
                        aria-hidden="true"
                      />
                      <span className={`relative z-10 flex w-1/2 items-center justify-center rounded-full px-3 py-2 transition ${billingInterval === "monthly" ? "text-white" : "text-[#5F625F]"}`}>Monthly</span>
                      <span className={`relative z-10 flex w-1/2 items-center justify-center rounded-full px-3 py-2 transition ${billingInterval === "yearly" ? "text-white" : "text-[#5F625F]"}`}>Yearly -{YEARLY_DISCOUNT_PERCENT}%</span>
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#667069]">Showing {selectedCurrency.code}. You can change this manually.</p>
                </div>
              </div>

              <p className="mt-6 text-center text-xs font-black uppercase tracking-[0.18em] text-[#B74A16] lg:hidden">Swipe for plan options</p>

              <div
                className="mx-auto mt-3 flex max-w-[360px] snap-x snap-mandatory gap-4 overflow-x-auto rounded-[30px] bg-[#FFF8EF]/70 px-3 py-4 sm:max-w-[390px] sm:px-4 lg:mt-7 lg:max-w-none lg:grid lg:grid-cols-3 lg:overflow-visible lg:bg-transparent lg:px-0 lg:py-0"
                style={{ scrollPaddingInline: "0.75rem" }}
              >
                {PRICING_PLANS.map((plan) => {
                  const amount = priceForPlan(plan.code, currencyCode, billingInterval);
                  const selected = selectedPlanCode === plan.code;
                  const loading = loadingPlan === plan.code;
                  return (
                    <article key={plan.code} className={`relative w-full flex-none snap-center overflow-hidden rounded-[28px] border p-4 shadow-[0_18px_46px_rgba(81,55,45,0.10)] transition hover:-translate-y-[3px] sm:p-5 lg:w-auto lg:max-w-none lg:rounded-[32px] ${plan.highlight ? "border-[#F97316]/35 bg-[linear-gradient(180deg,#FFF7ED_0%,#FFFFFF_62%,#FFF8EF_100%)]" : "border-[#E8D8C8]/90 bg-white"} ${selected ? "ring-2 ring-[#F97316]/25" : ""}`}>
                      {plan.highlight ? (
                        <p className="absolute right-5 top-5 rounded-full bg-[#F97316] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-sm">{plan.highlight}</p>
                      ) : null}
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B74A16]">{plan.productLimitLabel}</p>
                      <h3 className="mt-3 text-2xl font-black tracking-tight text-[#14110F] sm:text-3xl">{plan.name}</h3>
                      <p className="mt-2 min-h-[58px] text-sm leading-6 text-[#667069] sm:mt-3 sm:min-h-[72px]">{plan.description}</p>
                      <div className="mt-4 rounded-[22px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-3 sm:mt-5 sm:p-4">
                        <p className="text-3xl font-black tracking-tight text-[#14110F] sm:text-4xl">{formatPlanPrice(amount, currencyCode, { forceDecimals: billingInterval === "monthly" })}</p>
                        <p className="mt-1 text-sm font-bold text-[#667069]">{intervalLabel(billingInterval)}</p>
                        {billingInterval === "yearly" ? (
                          <p className="mt-2 text-xs font-bold text-[#B74A16]">Equivalent to about {formatPlanPrice(Math.round((amount / 12) * 100) / 100, currencyCode)} / month after discount.</p>
                        ) : (
                          <p className="mt-2 text-xs font-bold text-[#B74A16]">Yearly price: {formatPlanPrice(priceForPlan(plan.code, currencyCode, "yearly"), currencyCode)} / year.</p>
                        )}
                      </div>
                      <ul className="mt-4 space-y-2.5 text-sm leading-6 text-[#4B514C] sm:mt-5 sm:space-y-3">
                        <li className="flex gap-2"><span className="font-black text-[#F97316]">✓</span><span>{plan.productLimitLabel}</span></li>
                        <li className="flex gap-2"><span className="font-black text-[#F97316]">✓</span><span>Secure subscription billing</span></li>
                        <li className="flex gap-2"><span className="font-black text-[#F97316]">✓</span><span>Customer accounts, favourites, Buy Again and admin order flow</span></li>
                      </ul>
                      <button
                        type="button"
                        onClick={() => startCheckout(plan.code)}
                        disabled={Boolean(loadingPlan)}
                        className={`mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-black shadow-sm transition hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-70 sm:mt-6 sm:px-5 ${selected ? "bg-[#F97316] text-white hover:bg-[#EA580C]" : "bg-[#14110F] text-white hover:bg-[#2A211D]"}`}
                      >
                        {planButtonText(plan.name, selected, loading)}
                      </button>
                      <p className="mt-3 text-center text-xs text-[#667069]">Payment opens securely.</p>
                    </article>
                  );
                })}
              </div>

              {opened ? (
                <p className="mx-auto mt-5 max-w-3xl rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-900">
                  Secure checkout opened in a new window. Complete payment there, then return to Orduva for the updated billing status.
                </p>
              ) : null}
              {error ? (
                <p className="mx-auto mt-5 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-800">{error}</p>
              ) : null}
            </div>
          </section>

          <footer className="border-t border-[#51372D]/12 px-5 py-6 text-center text-sm text-[#667069] sm:px-7 lg:px-9">
            <p className="font-black text-[#14110F]">{LIVE_VERSION}</p>
          </footer>
        </div>
      </section>
    </main>
  );
}
