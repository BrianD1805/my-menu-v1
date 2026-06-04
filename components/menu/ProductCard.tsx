"use client";

import { useEffect, useRef, useState } from "react";
import { StoredCartItem, cartLineKey, readCart, subscribeToCartUpdates, writeCart } from "@/lib/cart";
import { buildMoneySettings, formatMoney, type MoneyFormatSettings } from "@/lib/money";
import { normalizeThemeColor, type StorefrontTheme } from "@/lib/storefront-theme";

type ProductVariant = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  priceDelta?: number | null;
  isActive: boolean;
};

function getVariantPrice(basePrice: number, variant: ProductVariant | null | undefined) {
  const explicitPrice = Number(variant?.price);
  if (Number.isFinite(explicitPrice) && explicitPrice >= 0) return explicitPrice;
  const legacyDelta = Number(variant?.priceDelta);
  return Math.max(0, Number(basePrice || 0) + (Number.isFinite(legacyDelta) ? legacyDelta : 0));
}

function getVariantPriceDeltaForCart(basePrice: number, variant: ProductVariant | null | undefined) {
  const explicitPrice = Number(variant?.price);
  if (Number.isFinite(explicitPrice) && explicitPrice >= 0) return 0;
  return Number((getVariantPrice(basePrice, variant) - Number(basePrice || 0)).toFixed(2));
}

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
  variantsEnabled?: boolean | null;
  variantLabel?: string | null;
  productVariants?: ProductVariant[] | null;
  productType?: string | null;
  customAmountEnabled?: boolean | null;
  customAmountLabel?: string | null;
  customAmountReferenceLabel?: string | null;
  customAmountReferenceRequired?: boolean | null;
  customAmountMin?: number | null;
  customAmountMax?: number | null;
  customAmountHelpText?: string | null;
  customAmountDisableRewards?: boolean | null;
  customAmountDisableDiscounts?: boolean | null;
  moneySettings?: MoneyFormatSettings;
  accentColor?: string | null;
  primaryColor?: string | null;
  themeColors?: StorefrontTheme | null;
  onAddToCartAnimation?: (payload: { imageUrl: string | null; name: string; sourceRect: DOMRect | null; targetRect?: DOMRect | null }) => void;
  isFavourite?: boolean;
  favouriteBusy?: boolean;
  onToggleFavourite?: (productId: string) => void;
  initiallyOpen?: boolean;
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

export default function ProductCard({ id, name, description, imageUrl, price, tenantSlug, stockEnabled = false, stockQuantity = 0, lowStockThreshold = 5, variantsEnabled = false, variantLabel = "Choose an option", productVariants = [], productType = "standard", customAmountEnabled = false, customAmountLabel = "Amount to pay", customAmountReferenceLabel = "Invoice number", customAmountReferenceRequired = true, customAmountMin = 1, customAmountMax = null, customAmountHelpText = "Enter the amount shown on your invoice.", customAmountDisableRewards = true, customAmountDisableDiscounts = true, moneySettings, accentColor, primaryColor, themeColors, onAddToCartAnimation, isFavourite = false, favouriteBusy = false, onToggleFavourite, initiallyOpen = false }: Props) {
  const [buttonState, setButtonState] = useState<"idle" | "adding" | "added">("idle");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [customAmountOpen, setCustomAmountOpen] = useState(false);
  const [customAmountValue, setCustomAmountValue] = useState("");
  const [customAmountReference, setCustomAmountReference] = useState("");
  const [customAmountNote, setCustomAmountNote] = useState("");
  const [customAmountError, setCustomAmountError] = useState("");
  const [pendingAddSource, setPendingAddSource] = useState<"card" | "modal">("card");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
  const [cartCount, setCartCount] = useState(0);
  const imageFrameRef = useRef<HTMLDivElement | null>(null);
  const modalImageFrameRef = useRef<HTMLDivElement | null>(null);
  const modalCartButtonRef = useRef<HTMLButtonElement | null>(null);

  const hasImage = !!imageUrl;
  const fullDescription = description?.trim() || "<p>A fresh favourite from the menu, ready to add to your order.</p>";
  const trackedStock = !!stockEnabled;
  const availableStock = Math.max(0, Number(stockQuantity || 0));
  const isOutOfStock = trackedStock && availableStock <= 0;
  const isLowStock = trackedStock && availableStock > 0 && availableStock <= Math.max(0, Number(lowStockThreshold || 5));
  const stockRibbonLabel = isOutOfStock ? "Out of stock" : isLowStock ? `Only ${availableStock} left` : null;
  const activeVariants = (Array.isArray(productVariants) ? productVariants : []).filter((variant) => variant && variant.isActive !== false && String(variant.name || "").trim());
  const shouldPickVariant = Boolean(variantsEnabled && activeVariants.length);
  const isCustomerAmountProduct = productType === "customer_amount" || customAmountEnabled === true;

  useEffect(() => {
    if (!initiallyOpen) return;
    trackStorefrontEvent("product_view", { source: "shared_product_link" });
    setDetailsOpen(true);
  }, [initiallyOpen]);

  useEffect(() => {
    const update = (items: StoredCartItem[]) => {
      setCartCount(items.reduce((total, item) => total + Math.max(0, item.quantity || 0), 0));
    };
    update(readCart<StoredCartItem>(tenantSlug));
    return subscribeToCartUpdates<StoredCartItem>(tenantSlug, update);
  }, [tenantSlug]);


  function trackStorefrontEvent(eventType: string, extra: Record<string, unknown> = {}) {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent("orduva:analytics", {
      detail: {
        eventType,
        scope: "tenant_storefront",
        tenantSlug,
        productId: id,
        productName: name,
        metadata: extra,
      },
    }));
  }

  function openDetails(source: string) {
    trackStorefrontEvent("product_view", { source });
    setDetailsOpen(true);
  }

  function cleanShareDescription(value: string | null | undefined) {
    return String(value || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  function productShareUrl() {
    if (typeof window === "undefined") return `/product/${encodeURIComponent(id)}`;
    return `${window.location.origin}/product/${encodeURIComponent(id)}`;
  }

  async function copyShareText(text: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  async function shareProduct() {
    trackStorefrontEvent("product_share", { source: "product_details_popup" });
    const url = productShareUrl();
    const cleanDescription = cleanShareDescription(description);
    const shareDescription = cleanDescription || `Have a look at ${name} on this menu.`;
    const text = `${shareDescription}\n\n${url}`;

    setShareStatus("idle");

    try {
      if (navigator.share) {
        await navigator.share({
          title: name,
          text: shareDescription,
          url,
        });
        return;
      }

      await copyShareText(`${name}\n${text}`);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      try {
        await copyShareText(`${name}\n${text}`);
        setShareStatus("copied");
        window.setTimeout(() => setShareStatus("idle"), 2200);
      } catch {
        setShareStatus("error");
        window.setTimeout(() => setShareStatus("idle"), 2600);
      }
    }
  }

  async function addToCart(source: "card" | "modal" = "card", variant?: ProductVariant | null, allowBaseProduct = false) {
    if (buttonState === "adding" || isOutOfStock) return;

    if (isCustomerAmountProduct && !allowBaseProduct) {
      setPendingAddSource(source);
      setCustomAmountOpen(true);
      return;
    }

    if (shouldPickVariant && !variant && !allowBaseProduct) {
      setPendingAddSource(source);
      setVariantPickerOpen(true);
      return;
    }

    const existing = readCart<StoredCartItem>(tenantSlug);
    const lineIdentity = { productId: id, variantId: variant?.id || null };
    const found = existing.find((item) => cartLineKey(item) === cartLineKey(lineIdentity));
    const productTotalQuantity = existing
      .filter((item) => item.productId === id)
      .reduce((sum, item) => sum + Math.max(0, Number(item.quantity || 0)), 0);
    if (trackedStock && productTotalQuantity >= availableStock) {
      setButtonState("added");
      setTimeout(() => setButtonState("idle"), 1200);
      return;
    }

    setButtonState("adding");
    trackStorefrontEvent("add_to_cart", { source, variantId: variant?.id || null, variantName: variant?.name || null });

    const sourceRect = (source === "modal" ? modalImageFrameRef.current : imageFrameRef.current)?.getBoundingClientRect() || null;
    const targetRect = source === "modal" ? modalCartButtonRef.current?.getBoundingClientRect() || null : null;
    onAddToCartAnimation?.({ imageUrl, name, sourceRect, targetRect });

    const cappedNextQuantity = trackedStock ? Math.max(0, availableStock - (productTotalQuantity - (found?.quantity || 0))) : Number.POSITIVE_INFINITY;
    const updated = found
      ? existing.map((item) =>
          cartLineKey(item) === cartLineKey(lineIdentity)
            ? { ...item, quantity: trackedStock ? Math.min(item.quantity + 1, cappedNextQuantity) : item.quantity + 1 }
            : item
        )
      : [
          ...existing,
          {
            productId: id,
            quantity: 1,
            variantId: variant?.id || null,
            variantName: variant?.name || null,
            variantLabel: variant ? (variantLabel || "Option") : null,
            variantPriceDelta: variant ? getVariantPriceDeltaForCart(Number(price || 0), variant) : 0,
            variantPrice: variant ? Number(getVariantPrice(Number(price || 0), variant).toFixed(2)) : null,
            variantDescription: variant?.description || null,
          },
        ];
    writeCart(tenantSlug, updated);
    setVariantPickerOpen(false);
    setButtonState("added");
    setTimeout(() => setButtonState("idle"), 1200);
  }



  async function addCustomAmountToCart() {
    setCustomAmountError("");
    const amount = Number(String(customAmountValue || "").replace(/,/g, ""));
    const minAmount = Math.max(0, Number(customAmountMin ?? 1));
    const maxAmount = customAmountMax === null || customAmountMax === undefined ? null : Number(customAmountMax);
    const reference = customAmountReference.trim();
    if (!Number.isFinite(amount) || amount <= 0) {
      setCustomAmountError("Please enter a valid payment amount.");
      return;
    }
    if (amount < minAmount) {
      setCustomAmountError(`Minimum amount is ${formatMoney(minAmount, money)}.`);
      return;
    }
    if (maxAmount !== null && Number.isFinite(maxAmount) && maxAmount > 0 && amount > maxAmount) {
      setCustomAmountError(`Maximum amount is ${formatMoney(maxAmount, money)}.`);
      return;
    }
    if (customAmountReferenceRequired !== false && !reference) {
      setCustomAmountError(`Please enter ${customAmountReferenceLabel || "the reference"}.`);
      return;
    }
    const existing = readCart<StoredCartItem>(tenantSlug);
    const line = {
      productId: id,
      quantity: 1,
      variantId: null,
      variantName: null,
      variantLabel: null,
      variantPriceDelta: 0,
      variantPrice: null,
      variantDescription: null,
      customAmount: Number(amount.toFixed(2)),
      customAmountReference: reference,
      customAmountNote: customAmountNote.trim() || null,
      customAmountLabel: customAmountLabel || "Amount to pay",
    };
    const key = cartLineKey(line);
    const withoutExisting = existing.filter((item) => cartLineKey(item) !== key);
    writeCart(tenantSlug, [...withoutExisting, line]);
    trackStorefrontEvent("add_to_cart", { source: pendingAddSource, customAmount: amount, customAmountReference: reference || null });
    setCustomAmountOpen(false);
    setCustomAmountValue("");
    setCustomAmountReference("");
    setCustomAmountNote("");
    setButtonState("added");
    setTimeout(() => setButtonState("idle"), 1200);
  }

  function goToCheckout() {
    trackStorefrontEvent("checkout_started", { source: "product_details_popup" });
    setDetailsOpen(false);
    if (typeof window !== "undefined") window.location.assign("/checkout");
  }

  function buttonLabel() {
    if (isOutOfStock) return "Sold out";
    if (buttonState === "adding") return "Adding";
    if (buttonState === "added") return "Added ✓";
    return isCustomerAmountProduct ? "Pay" : "Add";
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
            <button type="button" onClick={() => openDetails("product_card_image")} className="block overflow-visible text-left" aria-label={`View details for ${name}`}>
              <div className="relative overflow-visible pt-2">
                {stockRibbonLabel ? (
                  <div className="pointer-events-none absolute left-[10px] top-[10px] z-20 inline-flex max-w-[132px] -rotate-[18deg] items-center justify-center whitespace-nowrap rounded-full border px-3 py-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] shadow-[0_10px_24px_rgba(15,23,42,0.14)] backdrop-blur-[2px] sm:left-[12px] sm:top-[12px]"
                    style={isOutOfStock ? { backgroundColor: "rgba(255,255,255,0.94)", borderColor: "#FECACA", color: "#B91C1C" } : { backgroundColor: "rgba(255,255,255,0.94)", borderColor: "#FED7AA", color: "#C2410C" }}
                  >
                    {stockRibbonLabel}
                  </div>
                ) : null}
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
              </div>
            </button>

            <div className="min-w-0">
              <button type="button" onClick={() => openDetails("product_card_title")} className="block min-w-0 text-left">
                <h3 className="text-[1.1rem] font-semibold leading-[1.18] tracking-tight sm:text-[1.32rem] lg:text-[1.15rem] xl:text-[1.235rem]" style={{ color: productTitle }}>
                  {name}
                </h3>
              </button>
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
              onClick={() => openDetails("product_card_more") }
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

      {variantPickerOpen ? (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 px-[35px] py-[75px] backdrop-blur-[2px] overscroll-none" role="dialog" aria-modal="true" onClick={() => setVariantPickerOpen(false)}>
          <div className="flex min-h-full items-center justify-center">
            <div className="flex max-h-[calc(100dvh-150px)] w-full max-w-[720px] flex-col overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:rounded-[28px]" onClick={(event) => event.stopPropagation()}>
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/50 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-7">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{variantLabel || "Choose an option"}</p>
                    <h3 className="mt-2 pr-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">{name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Choose the standard product as shown, or select another available option.</p>
                  </div>
                  <button type="button" onClick={() => setVariantPickerOpen(false)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900" aria-label="Close variants">×</button>
                </div>
              </div>
              <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-6 sm:px-6 sm:pb-11 sm:pt-7 lg:px-7 lg:pb-12">
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => void addToCart(pendingAddSource, null, true)}
                    className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-emerald-200 bg-emerald-50/45 px-4 py-4 text-left shadow-sm transition hover:-translate-y-[1px] hover:bg-emerald-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-950">Standard product</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">Add {name} exactly as shown on the menu.</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-950">{formatMoney(price, money)}</span>
                  </button>
                  {activeVariants.map((variant) => {
                    const variantPrice = getVariantPrice(Number(price || 0), variant);
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => void addToCart(pendingAddSource, variant)}
                        className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-[1px] hover:border-emerald-200 hover:bg-emerald-50/40"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-950">{variant.name}</span>
                          {variant.description ? <span className="mt-1 block text-xs leading-5 text-slate-500">{variant.description}</span> : null}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-950">{formatMoney(variantPrice, money)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="sticky bottom-0 z-10 border-t border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-7">
                <button type="button" onClick={() => setVariantPickerOpen(false)} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-7 py-3 text-sm font-semibold text-emerald-700 transition hover:-translate-y-[1px] hover:bg-emerald-100 hover:ring-2 hover:ring-emerald-100">Back to menu</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {customAmountOpen ? (
        <div className="fixed inset-0 z-[125] bg-slate-950/60 px-[35px] py-[75px] backdrop-blur-[2px]" role="dialog" aria-modal="true" onClick={() => setCustomAmountOpen(false)}>
          <div className="flex min-h-full items-center justify-center">
            <div className="flex max-h-[calc(100dvh-150px)] w-full max-w-[560px] flex-col overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.30)]" onClick={(event) => event.stopPropagation()}>
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 px-5 pb-5 pt-5 sm:px-7">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-700 via-slate-700 to-emerald-500" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Customer payment</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{customAmountHelpText || "Enter the amount shown on your invoice."}</p>
                  </div>
                  <button type="button" onClick={() => setCustomAmountOpen(false)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 shadow-sm" aria-label="Close payment amount">×</button>
                </div>
              </div>
              <div className="modal-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-6 sm:px-7">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{customAmountReferenceLabel || "Invoice number"}{customAmountReferenceRequired !== false ? " *" : ""}</label>
                  <input value={customAmountReference} onChange={(event) => setCustomAmountReference(event.target.value)} placeholder="e.g. INV-1007" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{customAmountLabel || "Amount to pay"}</label>
                  <input type="number" min={Math.max(0, Number(customAmountMin ?? 1))} max={customAmountMax || undefined} step="0.01" value={customAmountValue} onChange={(event) => setCustomAmountValue(event.target.value)} placeholder={formatMoney(Math.max(0, Number(customAmountMin ?? 1)), money)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  <p className="mt-2 text-xs text-slate-500">{customAmountMax ? `Allowed range: ${formatMoney(Math.max(0, Number(customAmountMin ?? 1)), money)} to ${formatMoney(Number(customAmountMax), money)}.` : `Minimum amount: ${formatMoney(Math.max(0, Number(customAmountMin ?? 1)), money)}.`}</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Optional note</label>
                  <textarea value={customAmountNote} onChange={(event) => setCustomAmountNote(event.target.value)} rows={3} placeholder="Anything the store should know about this payment" className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>
                {customAmountError ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{customAmountError}</p> : null}
              </div>
              <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
                <button type="button" onClick={() => setCustomAmountOpen(false)} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button>
                <button type="button" onClick={() => void addCustomAmountToCart()} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white">Add payment</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {detailsOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 px-[35px] py-[75px] backdrop-blur-[2px] lg:px-6 lg:py-6 xl:p-8">
          <div className="flex min-h-full items-center justify-center">
            <div className="flex max-h-[calc(100dvh-150px)] w-full flex-col overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:rounded-[28px] lg:max-h-[calc(100dvh-3rem)] lg:max-w-[885px] lg:rounded-[30px]">
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/50 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-8 lg:pb-6 lg:pt-6">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Product details</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">{name}</h3>
                    <div className="mt-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                        {formatMoney(price, moneySettings)}
                      </span>
                      {trackedStock && (isOutOfStock || isLowStock) ? (
                        <span className={`ml-2 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${isOutOfStock ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-orange-50 text-orange-700 ring-1 ring-orange-100"}`}>
                          {isOutOfStock ? "Out of stock" : `Only ${availableStock} left`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      ref={modalCartButtonRef}
                      type="button"
                      onClick={goToCheckout}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-50 hover:text-slate-950"
                      aria-label={`Go to checkout with ${cartCount} item${cartCount === 1 ? "" : "s"}`}
                      title="Go to checkout"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="9" cy="20" r="1" />
                        <circle cx="18" cy="20" r="1" />
                        <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H7" />
                      </svg>
                      <span>{cartCount}</span>
                    </button>
                    <button type="button" onClick={() => setDetailsOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900" aria-label="Close details">×</button>
                  </div>
                </div>
              </div>

              <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-6 sm:px-6 sm:pb-11 sm:pt-7 lg:px-7 lg:pb-10 lg:pt-7 xl:px-8">
                <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-6">
                  <div ref={modalImageFrameRef} className="overflow-hidden rounded-[24px] bg-slate-100 ring-1 ring-black/5">
                    {hasImage ? (
                      <img src={imageUrl!} alt={name} className="h-72 w-full object-contain object-center bg-white p-4 sm:h-[22rem] lg:h-[18rem] lg:p-3 xl:h-[19rem]" />
                    ) : (
                      <div className="flex h-72 w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 sm:h-[22rem] lg:h-[18rem] xl:h-[19rem]">
                        <div className="mb-2 text-5xl">📦</div>
                        <p className="text-sm font-medium text-slate-600">Image coming soon</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 lg:space-y-4">
                    <button
                      type="button"
                      onClick={() => void shareProduct()}
                      className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.08)] ring-1 ring-white transition hover:-translate-y-[1px] hover:border-emerald-300 hover:shadow-[0_18px_42px_rgba(15,23,42,0.11)] sm:p-5"
                      aria-label={`Share ${name}`}
                    >
                      <span className="min-w-0">
                        <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Share this product</span>
                        <span className="mt-1 block text-sm font-medium leading-6 text-slate-600">Send this item to a friend by WhatsApp, email or messages.</span>
                      </span>
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-800 shadow-[0_12px_26px_rgba(15,23,42,0.10)] ring-1 ring-emerald-100" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3" />
                          <circle cx="6" cy="12" r="3" />
                          <circle cx="18" cy="19" r="3" />
                          <path d="m8.6 10.6 6.8-4.2" />
                          <path d="m8.6 13.4 6.8 4.2" />
                        </svg>
                      </span>
                    </button>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5 lg:p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Description</p>
                      <div
                        className="mt-3 text-[15px] leading-7 text-slate-700 [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:my-3"
                        dangerouslySetInnerHTML={{ __html: fullDescription }}
                      />
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Order note</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">Add this item now, or close this window and continue browsing the menu.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 z-10 border-t border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-5 xl:px-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button type="button" onClick={() => setDetailsOpen(false)} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:px-7">Back to menu</button>
                  </div>
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
                {shareStatus !== "idle" ? (
                  <p className={`mt-3 text-center text-xs font-semibold ${shareStatus === "copied" ? "text-emerald-700" : "text-red-600"}`}>
                    {shareStatus === "copied" ? "Product link copied." : "Could not share this product."}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
