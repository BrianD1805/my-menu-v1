"use client";

import { useRef, useState } from "react";
import { StoredCartItem, readCart, writeCart } from "@/lib/cart";
import { buildMoneySettings, formatMoney, type MoneyFormatSettings } from "@/lib/money";
import { normalizeThemeColor, type StorefrontTheme } from "@/lib/storefront-theme";

type Props = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  tenantSlug: string;
  stockEnabled?: boolean | null;
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
  moneySettings?: MoneyFormatSettings;
  accentColor?: string | null;
  primaryColor?: string | null;
  themeColors?: StorefrontTheme | null;
  onAddToCartAnimation?: (payload: { imageUrl: string | null; name: string; sourceRect: DOMRect | null }) => void;
  isFavourite?: boolean;
  favouriteBusy?: boolean;
  onToggleFavourite?: (productId: string) => void;
};

function withAlpha(color: string, alphaHex: string, fallback: string) {
  const normalized = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return `${normalized}${alphaHex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    const expanded = `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`;
    return `${expanded}${alphaHex}`;
  }
  return fallback;
}

export default function ProductCard({ id, name, description, imageUrl, price, tenantSlug, stockEnabled = false, stockQuantity = 0, lowStockThreshold = 5, moneySettings, accentColor, primaryColor, themeColors, onAddToCartAnimation, isFavourite = false, favouriteBusy = false, onToggleFavourite }: Props) {
  const [buttonState, setButtonState] = useState<"idle" | "adding" | "added">("idle");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const imageFrameRef = useRef<HTMLDivElement | null>(null);
  const modalImageFrameRef = useRef<HTMLDivElement | null>(null);

  const hasImage = !!imageUrl;
  const fullDescription = description?.trim() || "<p>A fresh favourite from the menu, ready to add to your order.</p>";
  const trackedStock = !!stockEnabled;
  const availableStock = Math.max(0, Number(stockQuantity || 0));
  const isOutOfStock = trackedStock && availableStock <= 0;
  const isLowStock = trackedStock && availableStock > 0 && availableStock <= Math.max(0, Number(lowStockThreshold || 5));

  async function addToCart(source: "card" | "modal" = "card") {
    if (buttonState === "adding" || isOutOfStock) return;

    const existing = readCart<StoredCartItem>(tenantSlug);
    const found = existing.find((item) => item.productId === id);
    if (trackedStock && found && found.quantity >= availableStock) {
      setButtonState("added");
      setTimeout(() => setButtonState("idle"), 1200);
      return;
    }

    setButtonState("adding");

    const sourceRect = (source === "modal" ? modalImageFrameRef.current : imageFrameRef.current)?.getBoundingClientRect() || null;
    onAddToCartAnimation?.({ imageUrl, name, sourceRect });

    const updated = found
      ? existing.map((item) => (item.productId === id ? { ...item, quantity: trackedStock ? Math.min(item.quantity + 1, availableStock) : item.quantity + 1 } : item))
      : [...existing, { productId: id, quantity: 1 }];
    writeCart(tenantSlug, updated);
    setButtonState("added");
    setTimeout(() => setButtonState("idle"), 1200);
  }

  function buttonLabel() {
    if (isOutOfStock) return "Sold out";
    if (buttonState === "adding") return "Adding";
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
  const brandAccent = accentColor || "#C7922F";
  const brandPrimary = primaryColor || "#7B1E22";
  const productCardBackground = normalizeThemeColor(themeColors?.productCardBackground, "#FFFFFF");
  const productCardBorder = normalizeThemeColor(themeColors?.productCardBorder, "#E2E8F0");
  const productTitle = normalizeThemeColor(themeColors?.productTitle, "#0F172A");
  const productHeartTickedBackground = normalizeThemeColor(themeColors?.productHeartTickedBackground, "#FEF3C7");
  const productHeartTickedText = normalizeThemeColor(themeColors?.productHeartTickedText, brandAccent);
  const productHeartUntickedBackground = normalizeThemeColor(themeColors?.productHeartUntickedBackground, "#FFFFFF");
  const productHeartUntickedText = normalizeThemeColor(themeColors?.productHeartUntickedText, "#64748B");
  const priceBoxBackground = normalizeThemeColor(themeColors?.priceBoxBackground, "#FFFFFF");
  const priceBoxBorder = normalizeThemeColor(themeColors?.priceBoxBorder, brandAccent);
  const priceText = normalizeThemeColor(themeColors?.priceText, brandPrimary);
  const addButtonBackground = normalizeThemeColor(themeColors?.addButtonBackground, "#FFFFFF");
  const addButtonBorder = normalizeThemeColor(themeColors?.addButtonBorder, brandAccent);
  const addButtonText = normalizeThemeColor(themeColors?.addButtonText, brandPrimary);
  const moreButtonBackground = normalizeThemeColor(themeColors?.moreButtonBackground, "#FFFFFF");
  const moreButtonBorder = normalizeThemeColor(themeColors?.moreButtonBorder, brandAccent);
  const moreButtonText = normalizeThemeColor(themeColors?.moreButtonText, brandPrimary);
  const cleanAccentBorder = withAlpha(addButtonBorder, "80", "rgba(199,146,47,0.50)");
  const cleanAccentSubtleBorder = withAlpha(moreButtonBorder, "55", "rgba(199,146,47,0.33)");
  const cleanAccentHairline = withAlpha(addButtonBorder, "2E", "rgba(199,146,47,0.18)");
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
      <div
        className="group relative h-full overflow-hidden rounded-[30px] border ring-1 ring-slate-200/70 transition duration-200 hover:-translate-y-[2px]"
        style={{ backgroundColor: productCardBackground, borderColor: productCardBorder }}
      >
        {onToggleFavourite ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavourite(id);
            }}
            disabled={favouriteBusy}
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-2xl border shadow-[0_12px_26px_rgba(15,23,42,0.12)] ring-1 ring-white/70 backdrop-blur-sm transition hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-70"
            style={{
              backgroundColor: isFavourite ? productHeartTickedBackground : productHeartUntickedBackground,
              borderColor: isFavourite ? productHeartTickedText : productHeartUntickedBackground,
              color: isFavourite ? productHeartTickedText : productHeartUntickedText,
            }}
            aria-label={isFavourite ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
            title={isFavourite ? "Remove favourite" : "Add favourite"}
          >
            <svg viewBox="0 0 24 24" className="h-[21px] w-[21px]" fill={isFavourite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />
            </svg>
          </button>
        ) : null}
        <div className="flex h-full flex-col gap-4 p-4 sm:gap-5 sm:p-5 lg:gap-6 lg:p-6">
          <div className="grid grid-cols-[8.25rem_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:gap-5 lg:grid-cols-[10.5rem_minmax(0,1fr)] lg:gap-6">
            <button type="button" onClick={() => setDetailsOpen(true)} className="block text-left" aria-label={`View details for ${name}`}>
              <div ref={imageFrameRef} className="aspect-square overflow-hidden rounded-[28px] bg-gray-100 ring-1 ring-black/5 shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                {hasImage ? (
                  <img src={imageUrl!} alt={name} className="h-full w-full object-contain object-center p-4 sm:p-5" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-3 text-center text-gray-500">
                    <div className="mb-1 text-3xl">📦</div>
                    <p className="text-xs font-medium text-gray-600">Image coming soon</p>
                  </div>
                )}
              </div>
            </button>

            <div className="min-w-0">
              <button type="button" onClick={() => setDetailsOpen(true)} className="block min-w-0 text-left">
                <h3 className="text-[1.1rem] font-semibold leading-[1.18] tracking-tight sm:text-[1.32rem] lg:text-[1.15rem] xl:text-[1.235rem]" style={{ color: productTitle }}>
                  {name}
                </h3>
              </button>
              {trackedStock ? (
                <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${isOutOfStock ? "bg-red-50 text-red-700 ring-1 ring-red-100" : isLowStock ? "bg-orange-50 text-orange-700 ring-1 ring-orange-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>
                  {isOutOfStock ? "Out of stock" : isLowStock ? `Only ${availableStock} left` : `${availableStock} in stock`}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 items-stretch gap-2 sm:gap-2.5 lg:gap-3">
            <div
              className="flex min-h-[38px] flex-col items-center justify-center rounded-[14px] border bg-white px-2.5 py-1.5 text-slate-950 ring-1 ring-black/[0.02] sm:min-h-[42px] sm:px-3 sm:py-2 lg:min-h-[46px] lg:rounded-[16px]"
              style={{ borderColor: priceBoxBorder, backgroundColor: priceBoxBackground }}
            >
              {usesCodeAndSymbol ? (
                <>
                  <span className="-mb-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] sm:text-[9.5px] lg:text-[10px]" style={{ color: priceBoxBorder }}>{codePart}</span>
                  <span className="whitespace-nowrap text-[0.78rem] font-semibold tracking-tight sm:text-[0.88rem] lg:text-[0.96rem]" style={{ color: priceText }}>{stackedAmount}</span>
                </>
              ) : (
                <span className="whitespace-nowrap text-[0.78rem] font-semibold tracking-tight sm:text-[0.88rem] lg:text-[0.96rem]" style={{ color: priceText }}>{fullPrice}</span>
              )}
            </div>

            <button
              type="button"
              className="inline-flex min-h-[38px] items-center justify-center whitespace-nowrap rounded-[14px] border bg-white px-2.5 py-1.5 text-[0.8rem] font-semibold transition hover:-translate-y-[1px] hover:ring-2 disabled:cursor-not-allowed disabled:opacity-85 sm:min-h-[42px] sm:px-3 sm:text-[0.84rem] lg:min-h-[46px] lg:rounded-[16px] lg:text-[0.88rem]"
              style={buttonState === "added"
                ? { borderColor: cleanAccentBorder, color: addButtonText, backgroundColor: addButtonBackground, boxShadow: "none", outlineColor: cleanAccentHairline }
                : { borderColor: cleanAccentBorder, color: addButtonText, backgroundColor: addButtonBackground, boxShadow: "none", outlineColor: cleanAccentHairline }}
              onClick={() => void addToCart("card")}
              disabled={buttonState === "adding" || isOutOfStock}
            >
              {buttonLabel()}
            </button>

            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="inline-flex min-h-[38px] items-center justify-center whitespace-nowrap rounded-[14px] border bg-white px-2.5 py-1.5 text-[0.8rem] font-semibold transition hover:-translate-y-[1px] hover:ring-2 sm:min-h-[42px] sm:px-3 sm:text-[0.84rem] lg:min-h-[46px] lg:rounded-[16px] lg:text-[0.88rem]"
              style={{ borderColor: cleanAccentSubtleBorder, color: moreButtonText, backgroundColor: moreButtonBackground, boxShadow: "none", outlineColor: cleanAccentHairline }}
              aria-label={`More info for ${name}`}
              title="More info"
            >
              More
            </button>
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
                    <div className="mt-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                        {formatMoney(price, moneySettings)}
                      </span>
                      {trackedStock ? (
                        <span className={`ml-2 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${isOutOfStock ? "bg-red-50 text-red-700 ring-1 ring-red-100" : isLowStock ? "bg-orange-50 text-orange-700 ring-1 ring-orange-100" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"}`}>
                          {isOutOfStock ? "Out of stock" : `${availableStock} in stock`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button type="button" onClick={() => setDetailsOpen(false)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900" aria-label="Close details">×</button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8 xl:py-7">
                <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr] xl:items-start xl:gap-7">
                  <div ref={modalImageFrameRef} className="overflow-hidden rounded-[24px] bg-slate-100 ring-1 ring-black/5">
                    {hasImage ? (
                      <img src={imageUrl!} alt={name} className="h-72 w-full object-contain object-center bg-white p-4 sm:h-[24rem] lg:h-[24rem] xl:h-[26rem]" />
                    ) : (
                      <div className="flex h-72 w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 sm:h-[24rem] lg:h-[24rem] xl:h-[26rem]">
                        <div className="mb-2 text-5xl">📦</div>
                        <p className="text-sm font-medium text-slate-600">Image coming soon</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 xl:space-y-5">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5 lg:p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Description</p>
                      <div
                        className="mt-3 text-[15px] leading-7 text-slate-700 [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:my-3"
                        dangerouslySetInnerHTML={{ __html: fullDescription }}
                      />
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Order note</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">Add this item now, or close this window and continue browsing the menu.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <button type="button" onClick={() => setDetailsOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:px-7">Back to menu</button>
                  <button
                    type="button"
                    onClick={() => { void addToCart("modal"); }}
                    disabled={buttonState === "adding" || isOutOfStock}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border bg-white px-7 py-3 text-sm font-semibold transition hover:-translate-y-[1px] hover:ring-2 disabled:cursor-not-allowed disabled:opacity-70 lg:px-8"
                    style={{ borderColor: cleanAccentBorder, color: addButtonText, backgroundColor: addButtonBackground, boxShadow: "none", outlineColor: cleanAccentHairline }}
                  >
                    {buttonState === "adding" ? "Adding..." : isOutOfStock ? "Sold out" : "Add"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
