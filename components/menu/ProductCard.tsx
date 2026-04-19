"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { StoredCartItem, readCart, writeCart } from "@/lib/cart";
import { buildMoneySettings, formatMoney, type MoneyFormatSettings } from "@/lib/money";

type Props = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  tenantSlug: string;
  moneySettings?: MoneyFormatSettings;
};

export default function ProductCard({ id, name, description, imageUrl, price, tenantSlug, moneySettings }: Props) {
  const [buttonState, setButtonState] = useState<"idle" | "adding" | "added">("idle");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const hasImage = !!imageUrl;
  const fullDescription = description?.trim() || "<p>A fresh favourite from the menu, ready to add to your order.</p>";

  async function addToCart() {
    if (buttonState === "adding") return;
    setButtonState("adding");
    const existing = readCart<StoredCartItem>(tenantSlug);
    const found = existing.find((item) => item.productId === id);
    const updated = found
      ? existing.map((item) => (item.productId === id ? { ...item, quantity: item.quantity + 1 } : item))
      : [...existing, { productId: id, quantity: 1 }];
    writeCart(tenantSlug, updated);
    setButtonState("added");
    setTimeout(() => setButtonState("idle"), 1200);
  }

  function buttonLabel() {
    if (buttonState === "adding") return "Adding...";
    if (buttonState === "added") return "Added ✓";
    return "Add";
  }

  const money = buildMoneySettings(moneySettings);
  const symbolPart = money.currencySymbol?.trim() || "";
  const codePart = money.currencyCode?.trim() || "";
  const usesCodeAndSymbol =
    (money.currencyDisplayMode === "code_symbol" || money.currencyDisplayMode === "symbol_code") &&
    !!codePart &&
    !!symbolPart;

  const fullPrice = formatMoney(price, money);
  const stackedAmount = formatMoney(price, {
    ...money,
    currencyDisplayMode: "symbol",
    currencySymbol: symbolPart,
    currencyCode: codePart,
    currencySuffix: money.currencySuffix,
    currencySymbolPosition: money.currencySymbolPosition,
  });

  return (
    <>
      <div className="group h-full overflow-hidden rounded-[30px] border border-white/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(246,249,247,0.98))] shadow-[0_20px_52px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-[2px] hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
        <div className="flex h-full flex-col gap-4 p-4 sm:gap-5 sm:p-5 lg:gap-6 lg:p-6">
          <div className="grid grid-cols-[8.25rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-5 lg:grid-cols-[10.5rem_minmax(0,1fr)] lg:gap-6">
            <button type="button" onClick={() => setDetailsOpen(true)} className="block text-left" aria-label={`View details for ${name}`}>
              <div className="aspect-square overflow-hidden rounded-[28px] bg-gray-100 ring-1 ring-black/5 shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                {hasImage ? <img src={imageUrl!} alt={name} className="h-full w-full object-contain object-center p-4 sm:p-5" loading="lazy" /> : <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-3 text-center text-gray-500"><div className="mb-1 text-3xl">📦</div><p className="text-xs font-medium text-gray-600">Image coming soon</p></div>}
              </div>
            </button>
            <div className="min-w-0">
              <div className="flex items-start gap-2">
                <button type="button" onClick={() => setDetailsOpen(true)} className="block min-w-0 flex-1 text-left">
                  <h3 className="text-[1.1rem] font-semibold leading-[1.18] tracking-tight text-slate-950 sm:text-[1.32rem] lg:text-[1.275rem] xl:text-[1.36rem]">{name}</h3>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="hidden lg:inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  aria-label={`Open details for ${name}`}
                  title="Open details"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-[8.25rem_4.65rem_minmax(0,1fr)] items-stretch gap-2.5 sm:grid-cols-[9.5rem_5rem_minmax(0,1fr)] sm:gap-3 lg:grid-cols-[10.5rem_4.75rem_minmax(6.9rem,1fr)] lg:gap-4">
            <div className="flex min-h-[56px] flex-col items-center justify-center rounded-[20px] bg-white px-3 py-2.5 text-slate-950 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 sm:min-h-[58px] sm:px-4 sm:py-3 lg:min-h-[60px]">
              {usesCodeAndSymbol ? (
                <>
                  <span className="-mb-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-[10.5px] lg:text-[11px]">{codePart}</span>
                  <span className="whitespace-nowrap text-[1rem] font-semibold tracking-tight text-slate-950 sm:text-[1.18rem] lg:text-[1.3rem]">{stackedAmount}</span>
                </>
              ) : (
                <span className="whitespace-nowrap text-[1rem] font-semibold tracking-tight text-slate-950 sm:text-[1.18rem] lg:text-[1.3rem]">{fullPrice}</span>
              )}
            </div>
            <button type="button" onClick={() => setDetailsOpen(true)} className="inline-flex min-h-[56px] items-center justify-center rounded-[20px] border border-slate-200 bg-white px-2.5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:border-slate-300 hover:text-slate-800 sm:min-h-[58px] sm:px-3 sm:text-[11.5px] lg:min-h-[60px] lg:px-2.5 lg:text-[11px]">More</button>
            <button className="inline-flex min-h-[56px] items-center justify-center whitespace-nowrap rounded-[20px] border border-emerald-200/90 bg-[linear-gradient(180deg,#f3fbf4_0%,#eaf7ec_100%)] px-2.5 py-3 text-[0.84rem] font-medium text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-80 sm:min-h-[58px] sm:px-3 sm:text-[0.9rem] lg:min-h-[60px] lg:min-w-[112px] lg:px-4.5 lg:text-[0.93rem]" onClick={addToCart} disabled={buttonState === "adding"}>{buttonLabel()}</button>
          </div>
        </div>
      </div>
      {detailsOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px]">
          <div className="flex min-h-dvh items-center justify-center px-4 py-5 sm:p-5 lg:p-6 xl:p-8">
            <div className="flex max-h-[calc(100dvh-2.5rem)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[28px] lg:max-h-[calc(100dvh-3rem)]">
              <div className="relative border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/50 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-8 lg:pb-7 lg:pt-6">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Product details</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">{name}</h3>
                    <div className="mt-4"><span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">{formatMoney(price, moneySettings)}</span></div>
                  </div>
                  <button type="button" onClick={() => setDetailsOpen(false)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900" aria-label="Close details">×</button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8 xl:py-7">
                <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr] xl:items-start xl:gap-7">
                  <div className="overflow-hidden rounded-[24px] bg-slate-100 ring-1 ring-black/5">{hasImage ? <img src={imageUrl!} alt={name} className="h-72 w-full object-contain object-center bg-white p-4 sm:h-[24rem] lg:h-[24rem] xl:h-[26rem]" /> : <div className="flex h-72 w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 sm:h-[24rem] lg:h-[24rem] xl:h-[26rem]"><div className="mb-2 text-5xl">📦</div><p className="text-sm font-medium text-slate-600">Image coming soon</p></div>}</div>
                  <div className="space-y-4 xl:space-y-5">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5 lg:p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Description</p><div className="mt-3 text-[15px] leading-7 text-slate-700 [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:my-3" dangerouslySetInnerHTML={{ __html: fullDescription }} /></div>
                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Order note</p><p className="mt-3 text-sm leading-6 text-slate-600">Add this item now, or close this window and continue browsing the menu.</p></div>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><button type="button" onClick={() => setDetailsOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:px-7">Back to menu</button><button type="button" onClick={() => { addToCart(); setDetailsOpen(false); }} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-7 py-3 text-sm font-medium text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 lg:px-8">{buttonState === "adding" ? "Adding..." : "Add"}</button></div></div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
