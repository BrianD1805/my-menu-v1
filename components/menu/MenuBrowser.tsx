"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import CartButton from "@/components/menu/CartButton";
import CustomerAccountHeaderActions from "@/components/account/CustomerAccountHeaderActions";
import ProductCard from "@/components/menu/ProductCard";
import {
  StoredCartItem,
  cartLineKey,
  readCart,
  subscribeToCartUpdates,
  writeCart,
} from "@/lib/cart";
import {
  buildMoneySettings,
  formatMoney,
  type MoneyFormatSettings,
} from "@/lib/money";
import {
  normalizeThemeColor,
  type StorefrontTheme,
} from "@/lib/storefront-theme";
import {
  getApplicableDiscounts,
  normalizeDiscountRules,
  type DiscountRule,
} from "@/lib/discounts";

type Category = {
  id: string;
  name: string;
};

type ProductVariant = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  priceDelta?: number | null;
  stockEnabled?: boolean | null;
  stockQuantity?: number | null;
  lowStockThreshold?: number | null;
  isActive: boolean;
};

function hasNumberValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function getVariantPrice(
  basePrice: number,
  variant: ProductVariant | null | undefined,
) {
  const explicitPrice = hasNumberValue(variant?.price) ? Number(variant?.price) : Number.NaN;
  if (Number.isFinite(explicitPrice) && explicitPrice >= 0)
    return explicitPrice;
  const legacyDelta = hasNumberValue(variant?.priceDelta) ? Number(variant?.priceDelta) : Number.NaN;
  return Math.max(
    0,
    Number(basePrice || 0) + (Number.isFinite(legacyDelta) ? legacyDelta : 0),
  );
}

function getVariantPriceDeltaForCart(
  basePrice: number,
  variant: ProductVariant | null | undefined,
) {
  const explicitPrice = hasNumberValue(variant?.price) ? Number(variant?.price) : Number.NaN;
  if (Number.isFinite(explicitPrice) && explicitPrice >= 0) return 0;
  return Number(
    (getVariantPrice(basePrice, variant) - Number(basePrice || 0)).toFixed(2),
  );
}

function variantStockState(
  product: Product | undefined,
  variant: ProductVariant | null | undefined,
) {
  if (variant) {
    const tracked = variant.stockEnabled === true;
    const available = Math.max(
      0,
      Math.floor(Number(variant.stockQuantity || 0)),
    );
    const threshold = Math.max(
      0,
      Math.floor(
        Number(variant.lowStockThreshold ?? product?.low_stock_threshold ?? 5),
      ),
    );
    return {
      tracked,
      available,
      threshold,
      outOfStock: tracked && available <= 0,
      lowStock: tracked && available > 0 && available <= threshold,
    };
  }

  const tracked = !!product?.stock_enabled;
  const available = Math.max(
    0,
    Math.floor(Number(product?.stock_quantity || 0)),
  );
  const threshold = Math.max(
    0,
    Math.floor(Number(product?.low_stock_threshold || 5)),
  );
  return {
    tracked,
    available,
    threshold,
    outOfStock: tracked && available <= 0,
    lowStock: tracked && available > 0 && available <= threshold,
  };
}

type Product = {
  id: string;
  category_id: string;
  secondary_category_id?: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  is_active?: boolean | null;
  stock_enabled?: boolean | null;
  stock_quantity?: number | null;
  low_stock_threshold?: number | null;
  variants_enabled?: boolean | null;
  variant_label?: string | null;
  product_variants?: ProductVariant[] | null;
  product_type?: string | null;
  custom_amount_enabled?: boolean | null;
  custom_amount_label?: string | null;
  custom_amount_reference_label?: string | null;
  custom_amount_reference_required?: boolean | null;
  custom_amount_min?: number | null;
  custom_amount_max?: number | null;
  custom_amount_help_text?: string | null;
  custom_amount_disable_rewards?: boolean | null;
  custom_amount_disable_discounts?: boolean | null;
};

type InvoicePaymentOption = {
  id: "invoice" | "deposit" | "statement_balance";
  title: string;
  description: string;
  referenceLabel: string;
  amountLabel: string;
  minAmount: number;
};

type InvoicePaymentCardProps = {
  option: InvoicePaymentOption;
  moneySettings: MoneyFormatSettings;
  brandPrimary: string;
  brandAccent: string;
  brandBorder: string;
  onPay: (option: InvoicePaymentOption) => void;
};

function InvoicePaymentCard({
  option,
  moneySettings,
  brandPrimary,
  brandAccent,
  brandBorder,
  onPay,
}: InvoicePaymentCardProps) {
  return (
    <article
      className="relative overflow-hidden rounded-[28px] border bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.08)] ring-1 ring-white/80 sm:p-6"
      style={{ borderColor: brandBorder }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: brandAccent }}
      />
      <div className="relative z-10 flex h-full flex-col">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: brandAccent }}
        >
          Secure payment
        </p>
        <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
          {option.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
          {option.description}
        </p>
        <div className="mt-4 grid gap-2 text-xs text-slate-500">
          <span>{option.referenceLabel} required</span>
          <span>Minimum: {formatMoney(option.minAmount, moneySettings)}</span>
        </div>
        <button
          type="button"
          onClick={() => onPay(option)}
          className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition hover:-translate-y-[1px]"
          style={{ backgroundColor: brandPrimary }}
        >
          Pay now
        </button>
      </div>
    </article>
  );
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) =>
      Math.max(0, Math.min(255, Math.round(value)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();
}

function blendHex(from: string, to = "#FFFFFF", amount = 0.7) {
  const start = hexToRgb(normalizeThemeColor(from, "#FFFFFF"));
  const end = hexToRgb(normalizeThemeColor(to, "#FFFFFF"));
  return rgbToHex(
    start.r + (end.r - start.r) * amount,
    start.g + (end.g - start.g) * amount,
    start.b + (end.b - start.b) * amount,
  );
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(normalizeThemeColor(hex, "#FFFFFF"));
  const transform = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

function readableTextFor(
  background: string,
  preferred: string,
  darkFallback = "#0F172A",
  lightFallback = "#FFFFFF",
) {
  const bgLum = relativeLuminance(background);
  const preferredLum = relativeLuminance(preferred);
  const ratio =
    (Math.max(bgLum, preferredLum) + 0.05) /
    (Math.min(bgLum, preferredLum) + 0.05);
  if (ratio >= 4.2) return preferred;
  return bgLum > 0.55 ? darkFallback : lightFallback;
}

function softerPanelColor(
  value: unknown,
  fallback: string,
  blendAmount = 0.76,
) {
  return blendHex(normalizeThemeColor(value, fallback), "#FFFFFF", blendAmount);
}

type FavouriteProductStripCardProps = {
  product: Product;
  moneySettings: MoneyFormatSettings;
  accentColor: string;
  primaryColor: string;
  isBusy: boolean;
  themeColors?: StorefrontTheme | null;
  stripKind?: "favourite" | "buyAgain";
  onAddToCart: (
    productId: string,
    options?: {
      sourceRect?: DOMRect | null;
      imageUrl?: string | null;
      name?: string;
      targetRect?: DOMRect | null;
    },
  ) => void;
  onRemoveFavourite?: (productId: string) => void;
};

function FavouriteProductStripCard({
  product,
  moneySettings,
  accentColor,
  primaryColor,
  isBusy,
  themeColors,
  stripKind = "favourite",
  onAddToCart,
  onRemoveFavourite,
}: FavouriteProductStripCardProps) {
  const imageFrameRef = useRef<HTMLDivElement | null>(null);
  const money = buildMoneySettings(moneySettings);
  const favouriteCardBackground = normalizeThemeColor(
    themeColors?.favouritesCardBackground,
    "#FFFFFF",
  );
  const favouriteCardBorder = normalizeThemeColor(
    themeColors?.favouritesCardBorder,
    "#FCD34D",
  );
  const favouriteCardShadow = normalizeThemeColor(
    themeColors?.favouritesCardShadow,
    accentColor,
  );
  const favouriteCardShadowEnabled =
    themeColors?.favouritesCardShadowEnabled !== false;
  const favouriteCardTitle = normalizeThemeColor(
    themeColors?.favouritesCardTitle,
    "#0F172A",
  );
  const favouritePriceBackground = normalizeThemeColor(
    themeColors?.favouritesPriceBackground,
    "#FFFFFF",
  );
  const favouritePriceBorder = normalizeThemeColor(
    themeColors?.favouritesPriceBorder,
    accentColor,
  );
  const favouritePriceText = normalizeThemeColor(
    themeColors?.favouritesPriceText,
    primaryColor,
  );
  const favouriteAddBackground = normalizeThemeColor(
    themeColors?.favouritesAddBackground,
    primaryColor,
  );
  const favouriteAddBorder = normalizeThemeColor(
    themeColors?.favouritesAddBorder,
    accentColor,
  );
  const favouriteAddText = normalizeThemeColor(
    themeColors?.favouritesAddText,
    "#FFFFFF",
  );
  const favouriteRemoveBackground = normalizeThemeColor(
    themeColors?.favouritesRemoveBackground,
    "#FFFFFF",
  );
  const favouriteRemoveText = normalizeThemeColor(
    themeColors?.favouritesRemoveText,
    accentColor,
  );
  const favouriteSwipeText = normalizeThemeColor(
    themeColors?.favouritesSwipeText,
    accentColor,
  );
  const stripIsBuyAgain = stripKind === "buyAgain";
  const stripPillIcon = stripIsBuyAgain ? "↻" : "♥";
  const stripPillLabel = stripIsBuyAgain ? "Buy again" : "Favourite";
  const stripSwipeLabel = stripIsBuyAgain
    ? "Swipe to view previous buys"
    : "Swipe to view all favourites";
  const trackedStock = !!product.stock_enabled;
  const availableStock = Math.max(0, Number(product.stock_quantity || 0));
  const lowStockThreshold = Math.max(
    0,
    Number(product.low_stock_threshold || 5),
  );
  const isOutOfStock = trackedStock && availableStock <= 0;
  const isLowStock =
    trackedStock && availableStock > 0 && availableStock <= lowStockThreshold;
  const stockRibbonLabel = isOutOfStock
    ? "Out of stock"
    : isLowStock
      ? `Only ${availableStock} left`
      : null;

  return (
    <article
      className="relative flex w-[62vw] max-w-[248px] shrink-0 snap-center flex-col overflow-hidden rounded-[24px] border p-3 ring-1 ring-white/80 sm:w-[248px]"
      style={{
        backgroundColor: favouriteCardBackground,
        borderColor: favouriteCardBorder,
        boxShadow: favouriteCardShadowEnabled
          ? `0 8px 18px ${favouriteCardShadow}14`
          : "none",
      }}
    >
      <div className="pointer-events-none absolute -right-11 -top-11 h-24 w-24 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-rose-300/8 blur-3xl" />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border bg-white/85 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] shadow-sm"
          style={{
            borderColor: favouritePriceBorder,
            color: favouriteSwipeText,
          }}
        >
          <span aria-hidden="true">{stripPillIcon}</span>
          {stripPillLabel}
        </span>
        {onRemoveFavourite ? (
          <button
            type="button"
            onClick={() => onRemoveFavourite(product.id)}
            disabled={isBusy}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/80 shadow-[0_8px_18px_rgba(120,53,15,0.12)] transition hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-70"
            style={{
              backgroundColor: favouriteRemoveBackground,
              color: favouriteRemoveText,
            }}
            aria-label={`Remove ${product.name} from favourites`}
            title="Remove favourite"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />
            </svg>
          </button>
        ) : (
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-base font-black shadow-[0_8px_18px_rgba(120,53,15,0.10)]"
            style={{ color: favouriteSwipeText }}
            aria-hidden="true"
          >
            ↻
          </span>
        )}
      </div>

      <div className="relative z-10 mx-auto mt-4 w-full overflow-visible pt-3">
        {stockRibbonLabel ? (
          <div
            className="pointer-events-none absolute left-[10px] top-[20px] z-20 inline-flex max-w-[102px] -rotate-[16deg] items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-[5px] text-center text-[7.5px] font-semibold uppercase tracking-[0.07em] shadow-[0_10px_22px_rgba(15,23,42,0.14)] backdrop-blur-[2px] sm:left-[11px] sm:top-[21px]"
            style={
              isOutOfStock
                ? {
                    backgroundColor: "rgba(255,255,255,0.94)",
                    borderColor: "#FECACA",
                    color: "#B91C1C",
                  }
                : {
                    backgroundColor: "rgba(255,255,255,0.94)",
                    borderColor: "#FED7AA",
                    color: "#C2410C",
                  }
            }
          >
            {stockRibbonLabel}
          </div>
        ) : null}
        <div
          ref={imageFrameRef}
          className="aspect-[1.25/1] w-full overflow-hidden rounded-[20px] border border-white/80 shadow-[0_13px_30px_rgba(15,23,42,0.10)]"
          style={{ backgroundColor: favouritePriceBackground }}
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain p-3"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 via-white to-slate-100 text-3xl">
              📦
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-3 flex flex-1 flex-col text-center">
        <h3
          className="mx-auto line-clamp-2 text-[0.94rem] font-semibold leading-tight tracking-tight"
          style={{ color: favouriteCardTitle }}
        >
          {product.name}
        </h3>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span
            className="rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-sm"
            style={{
              backgroundColor: favouritePriceBackground,
              borderColor: favouritePriceBorder,
              color: favouritePriceText,
            }}
          >
            {formatMoney(Number(product.price), money)}
          </span>
          <button
            type="button"
            onClick={() =>
              onAddToCart(product.id, {
                sourceRect:
                  imageFrameRef.current?.getBoundingClientRect() || null,
                imageUrl: product.image_url,
                name: product.name,
              })
            }
            disabled={isOutOfStock}
            className="inline-flex min-h-[34px] items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-black shadow-[0_11px_22px_rgba(15,23,42,0.16)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-65"
            style={{
              backgroundColor: favouriteAddBackground,
              borderColor: favouriteAddBorder,
              color: favouriteAddText,
            }}
          >
            {isOutOfStock ? "Sold out" : "Add"}
          </button>
        </div>
        <p
          className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em]"
          style={{ color: favouriteSwipeText }}
        >
          {stripSwipeLabel}
        </p>
      </div>
    </article>
  );
}

type CustomerRewardSummary = {
  enabled: boolean;
  programName: string;
  tier: "silver" | "gold" | "platinum";
  tierLabel: string;
  discountPercent: number;
  qualifyingSpend: number;
  nextTier: "silver" | "gold" | "platinum" | null;
  nextTierLabel: string | null;
  spendToNextTier: number;
  progressPercent: number;
};

type FlyingCartItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  startLeft: number;
  startTop: number;
  startWidth: number;
  startHeight: number;
  endCenterX: number;
  endCenterY: number;
  started: boolean;
};

function stripHtml(value: string | null | undefined) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function iconLinkClass() {
  return "inline-flex h-[50px] w-[50px] items-center justify-center rounded-[18px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] text-slate-700 shadow-[0_14px_32px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.88)] ring-1 ring-slate-900/5 backdrop-blur-sm transition duration-200 hover:-translate-y-[2px] hover:scale-[1.03] hover:border-white hover:bg-white hover:text-slate-950 hover:shadow-[0_20px_42px_rgba(15,23,42,0.16)] focus:outline-none focus:ring-2 focus:ring-slate-300 active:translate-y-0 active:scale-[0.98] sm:h-[52px] sm:w-[52px]";
}

function cleanDialString(value: string | null | undefined) {
  return String(value || "")
    .replace(/[^+\d]/g, "")
    .replace(/(?!^)\+/g, "");
}

function cleanWhatsAppNumber(value: string | null | undefined) {
  return String(value || "").replace(/[^\d]/g, "");
}

function normaliseExternalUrl(value: string | null | undefined) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text}`;
}

function FooterIcon({
  label,
  href,
  children,
}: {
  label: string;
  href: string | null;
  children: ReactNode;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      className={iconLinkClass()}
      aria-label={label}
      title={label}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      <span className="sr-only">{label}</span>
      {children}
    </a>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[23px] w-[23px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.1 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L9 10.69a16 16 0 0 0 4.31 4.31l1.25-1.25a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[23px] w-[23px]"
      fill="currentColor"
    >
      <path d="M12.04 2a9.86 9.86 0 0 0-8.5 14.86L2.5 22l5.29-1a9.9 9.9 0 1 0 4.25-19Zm0 17.9a8.02 8.02 0 0 1-4.08-1.12l-.29-.17-3.14.6.61-3.05-.19-.31a7.98 7.98 0 1 1 7.09 4.05Zm4.39-5.99c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}
function EmailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[23px] w-[23px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[23px] w-[23px]"
      fill="currentColor"
    >
      <path d="M14.2 8.4V6.7c0-.8.5-1 1-1h1.6V3.1A21.6 21.6 0 0 0 14.4 3c-2.4 0-4 1.5-4 4.1v1.3H7.7v3h2.7V21h3.3v-9.6h2.7l.4-3h-3.1Z" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[23px] w-[23px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.25" />
      <circle cx="17.3" cy="6.7" r=".65" fill="currentColor" stroke="none" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[23px] w-[23px]"
      fill="currentColor"
    >
      <path d="M14.6 3h2.8c.2 1.3.8 2.4 1.7 3.2.8.8 1.8 1.3 3 1.5v2.9a8.4 8.4 0 0 1-4.6-1.5v5.9c0 3.5-2.5 6-5.9 6A5.6 5.6 0 0 1 6 15.4c0-3.3 2.5-5.7 5.7-5.7.4 0 .8 0 1.1.1v3a3.5 3.5 0 0 0-1.1-.2 2.7 2.7 0 1 0 2.8 2.7V3Z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[23px] w-[23px]"
      fill="currentColor"
    >
      <path d="M13.8 10.5 21 3h-1.7l-6.2 6.4L8.1 3H2.4l7.6 9.8L2.4 21h1.7l6.6-7 5.3 7h5.7l-7.9-10.5Zm-2.4 2.4-.8-1L4.5 4.3h2.8l4.9 6.1.8 1 6.4 8.2h-2.8l-5.2-6.7Z" />
    </svg>
  );
}
function WebsiteIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[23px] w-[23px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a13.7 13.7 0 0 1 0 18" />
      <path d="M12 3a13.7 13.7 0 0 0 0 18" />
    </svg>
  );
}

function getRewardTierPalette(name: string) {
  const key = String(name || "").toLowerCase();
  if (key.includes("platinum")) {
    return {
      label: "Platinum",
      background: "#F8FAFC",
      border: "#64748B",
      text: "#0F172A",
      badgeBackground: "#0F172A",
      badgeText: "#F8FAFC",
      gradientFrom: "#64748B",
      gradientTo: "#0F172A",
    };
  }
  if (key.includes("gold")) {
    return {
      label: "Gold",
      background: "#FFFBEB",
      border: "#D97706",
      text: "#78350F",
      badgeBackground: "#92400E",
      badgeText: "#FFF7ED",
      gradientFrom: "#F59E0B",
      gradientTo: "#92400E",
    };
  }
  return {
    label: "Silver",
    background: "#F8FAFC",
    border: "#64748B",
    text: "#0F172A",
    badgeBackground: "#334155",
    badgeText: "#F8FAFC",
    gradientFrom: "#64748B",
    gradientTo: "#334155",
  };
}

function RewardInfoRow({
  name,
  spend,
  discount,
}: {
  name: string;
  spend: string;
  discount: number;
}) {
  const palette = getRewardTierPalette(name);
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm"
      style={{
        backgroundColor: palette.background,
        borderColor: palette.border,
        color: palette.text,
      }}
    >
      <span>
        <span className="block font-black">{name}</span>
        <span className="mt-0.5 block text-xs opacity-75">{spend}</span>
      </span>
      <span
        className="rounded-full px-3 py-1 text-xs font-black"
        style={{
          backgroundColor: palette.badgeBackground,
          color: palette.badgeText,
        }}
      >
        {discount}% off
      </span>
    </div>
  );
}

function StorefrontQuickActionButton({
  label,
  actionLabel,
  icon,
  onClick,
  expanded,
  controls,
  borderColor,
  textColor,
  iconTextColor = "#FFFFFF",
  iconBackground,
  variant = "compact",
}: {
  label: string;
  actionLabel: string;
  icon: ReactNode;
  onClick: () => void;
  expanded?: boolean;
  controls?: string;
  borderColor: string;
  textColor: string;
  iconTextColor?: string;
  iconBackground: string;
  variant?: "compact" | "wide" | "header";
}) {
  const isWide = variant === "wide";
  const isHeader = variant === "header";
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isWide
          ? "group flex min-h-[4.9rem] w-full max-w-[21rem] items-center justify-start gap-3 rounded-[24px] border bg-white/92 px-4 py-3.5 text-left shadow-[0_14px_32px_rgba(15,23,42,0.09)] ring-1 ring-white/70 backdrop-blur transition hover:-translate-y-[1px] hover:bg-white focus:outline-none"
          : isHeader
            ? "group flex min-w-[4.3rem] flex-col items-center justify-center gap-1 rounded-[18px] bg-white/82 px-2.5 py-2 text-center shadow-sm backdrop-blur transition hover:-translate-y-[1px] hover:bg-white focus:outline-none"
            : "group flex w-full min-w-0 shrink-0 flex-col items-center justify-center gap-1 rounded-[18px] bg-white/86 px-1.5 py-2.5 text-center shadow-sm backdrop-blur transition hover:-translate-y-[1px] hover:bg-white focus:outline-none"
      }
      style={{ borderColor, color: textColor }}
      aria-expanded={expanded}
      aria-controls={controls}
    >
      <span
        className={
          isWide
            ? "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] shadow-sm transition group-hover:scale-[1.03]"
            : "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-sm transition group-hover:scale-[1.03]"
        }
        style={{ backgroundColor: iconBackground, color: iconTextColor }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className={isWide ? "min-w-0 text-left" : "min-w-0 text-center"}>
        <span
          className={
            isWide
              ? "block text-[13px] font-black uppercase leading-tight tracking-[0.12em]"
              : "block whitespace-nowrap text-[10px] font-bold uppercase leading-none tracking-[0.08em]"
          }
        >
          {label}
        </span>
        <span
          className={
            isWide
              ? "mt-1 block text-[11px] font-semibold leading-snug normal-case tracking-normal opacity-72"
              : "mt-1 block whitespace-nowrap text-[10px] font-bold uppercase leading-none tracking-[0.08em] opacity-70"
          }
        >
          {actionLabel}
        </span>
      </span>
    </button>
  );
}

export default function MenuBrowser({
  tenantSlug,
  tenantId,
  tenantName,
  version,
  categories,
  products,
  logoUrl,
  headerLogoUrl,
  welcomeHeading,
  welcomeSubheading,
  primaryColor,
  accentColor,
  backgroundTint,
  borderColor,
  textColor,
  contactPhone,
  contactEmail,
  contactWhatsApp,
  contactAddress,
  footerBlurb,
  footerNotice,
  showOrduvaReferralAd,
  socialFacebookUrl,
  socialInstagramUrl,
  socialTikTokUrl,
  socialXUrl,
  socialWebsiteUrl,
  currencyName,
  currencyCode,
  currencySymbol,
  currencyDisplayMode,
  currencySymbolPosition,
  currencyDecimalPlaces,
  currencyUseThousandsSeparator,
  currencyDecimalSeparator,
  currencyThousandsSeparator,
  currencySuffix,
  storefrontTheme,
  trialState,
  rewardsEnabled,
  rewardsProgramName,
  rewardsSilverDiscountPercent,
  rewardsGoldMinSpend,
  rewardsGoldDiscountPercent,
  rewardsPlatinumMinSpend,
  rewardsPlatinumDiscountPercent,
  discountsEnabled,
  discountPopupEnabled,
  discountPopupTitle,
  discountPopupMessage,
  discountRules,
  invoicePaymentsEnabled,
  invoicePaymentsSectionTitle,
  invoicePaymentsIntroText,
  invoicePaymentsInvoiceEnabled,
  invoicePaymentsDepositEnabled,
  invoicePaymentsBalanceEnabled,
  initialProductId,
  onFirstMeaningfulPaintReady,
}: {
  tenantSlug: string;
  tenantId: string;
  tenantName: string;
  version: string;
  categories: Category[];
  products: Product[];
  logoUrl?: string | null;
  headerLogoUrl?: string | null;
  welcomeHeading?: string;
  welcomeSubheading?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundTint?: string | null;
  borderColor?: string | null;
  textColor?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  contactWhatsApp?: string | null;
  contactAddress?: string | null;
  footerBlurb?: string | null;
  footerNotice?: string | null;
  showOrduvaReferralAd?: boolean | null;
  socialFacebookUrl?: string | null;
  socialInstagramUrl?: string | null;
  socialTikTokUrl?: string | null;
  socialXUrl?: string | null;
  socialWebsiteUrl?: string | null;
  currencyName?: string | null;
  currencyCode?: string | null;
  currencySymbol?: string | null;
  currencyDisplayMode?: MoneyFormatSettings["currencyDisplayMode"];
  currencySymbolPosition?: MoneyFormatSettings["currencySymbolPosition"];
  currencyDecimalPlaces?: number | null;
  currencyUseThousandsSeparator?: boolean | null;
  currencyDecimalSeparator?: string | null;
  currencyThousandsSeparator?: string | null;
  currencySuffix?: string | null;
  storefrontTheme?: StorefrontTheme | null;
  trialState?: {
    checkoutBlocked?: boolean;
    isTrialExpired?: boolean;
    customerMessage?: string | null;
  } | null;
  rewardsEnabled?: boolean | null;
  rewardsProgramName?: string | null;
  rewardsSilverDiscountPercent?: number | null;
  rewardsGoldMinSpend?: number | null;
  rewardsGoldDiscountPercent?: number | null;
  rewardsPlatinumMinSpend?: number | null;
  rewardsPlatinumDiscountPercent?: number | null;
  discountsEnabled?: boolean | null;
  discountPopupEnabled?: boolean | null;
  discountPopupTitle?: string | null;
  discountPopupMessage?: string | null;
  discountRules?: DiscountRule[] | null;
  invoicePaymentsEnabled?: boolean | null;
  invoicePaymentsSectionTitle?: string | null;
  invoicePaymentsIntroText?: string | null;
  invoicePaymentsInvoiceEnabled?: boolean | null;
  invoicePaymentsDepositEnabled?: boolean | null;
  invoicePaymentsBalanceEnabled?: boolean | null;
  initialProductId?: string | null;
  onFirstMeaningfulPaintReady?: () => void;
}) {
  const moneySettings = buildMoneySettings({
    currencyName,
    currencyCode,
    currencySymbol,
    currencyDisplayMode,
    currencySymbolPosition,
    currencyDecimalPlaces,
    currencyUseThousandsSeparator,
    currencyDecimalSeparator,
    currencyThousandsSeparator,
    currencySuffix,
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const cartButtonRef = useRef<HTMLAnchorElement | null>(null);
  const searchCartIndicatorRef = useRef<HTMLButtonElement | null>(null);
  const favouritesStripRef = useRef<HTMLDivElement | null>(null);
  const buyAgainStripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem("orduva_active_tenant_slug", tenantSlug);
      window.localStorage.setItem("orduva_active_tenant_id", tenantId);
    } catch {}
  }, [tenantSlug, tenantId]);

  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [buttonStateById, setButtonStateById] = useState<
    Record<string, "idle" | "adding" | "added">
  >({});
  const [cartCount, setCartCount] = useState(0);
  const [customAmountPickerProduct, setCustomAmountPickerProduct] = useState<{
    product: Product;
    options?: {
      sourceRect?: DOMRect | null;
      imageUrl?: string | null;
      name?: string;
      targetRect?: DOMRect | null;
      destination?: "header" | "search";
    };
  } | null>(null);
  const [customAmountValue, setCustomAmountValue] = useState("");
  const [customAmountReference, setCustomAmountReference] = useState("");
  const [customAmountNote, setCustomAmountNote] = useState("");
  const [customAmountCustomerName, setCustomAmountCustomerName] = useState("");
  const [customAmountCustomerPhone, setCustomAmountCustomerPhone] =
    useState("");
  const [customAmountError, setCustomAmountError] = useState("");
  const [customAmountSubmitting, setCustomAmountSubmitting] = useState(false);
  const [variantPickerProduct, setVariantPickerProduct] = useState<{
    product: Product;
    source: string;
    options?: {
      sourceRect?: DOMRect | null;
      imageUrl?: string | null;
      name?: string;
      targetRect?: DOMRect | null;
      destination?: "header" | "search";
    };
  } | null>(null);
  const [cartPulseKey, setCartPulseKey] = useState(0);
  const [flyingItems, setFlyingItems] = useState<FlyingCartItem[]>([]);
  const [welcomeCustomerName, setWelcomeCustomerName] = useState<string | null>(
    null,
  );
  const [customerRewards, setCustomerRewards] =
    useState<CustomerRewardSummary | null>(null);
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);
  const [discountsModalOpen, setDiscountsModalOpen] = useState(false);
  const [welcomeActionsStage, setWelcomeActionsStage] = useState(0);
  const [discountPopupSeen, setDiscountPopupSeen] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [favouritesReady, setFavouritesReady] = useState(false);
  const [favouritesSignedIn, setFavouritesSignedIn] = useState(false);
  const [customerAuthStatus, setCustomerAuthStatus] = useState<
    "checking" | "signedIn" | "signedOut"
  >("checking");
  const [favouriteBusyById, setFavouriteBusyById] = useState<
    Record<string, boolean>
  >({});
  const [favouritesMessage, setFavouritesMessage] = useState<string | null>(
    null,
  );
  const [favouriteLoginPromptOpen, setFavouriteLoginPromptOpen] =
    useState(false);
  const [favouritesVisible, setFavouritesVisible] = useState(false);
  const [buyAgainIds, setBuyAgainIds] = useState<string[]>([]);
  const [buyAgainReady, setBuyAgainReady] = useState(false);
  const [buyAgainVisible, setBuyAgainVisible] = useState(false);
  const [buyAgainMessage, setBuyAgainMessage] = useState<string | null>(null);

  const brandPrimary = primaryColor || "#7B1E22";
  const brandAccent = accentColor || "#C7922F";
  const brandSurface = normalizeThemeColor(
    storefrontTheme?.globalPageBackground || backgroundTint,
    "#F8F4F0",
  );
  const brandBorder = normalizeThemeColor(
    storefrontTheme?.globalBorder || borderColor,
    "#D9C7A3",
  );
  const brandText = normalizeThemeColor(
    storefrontTheme?.globalText || textColor,
    "#2B2B2B",
  );
  const brandSoftText = normalizeThemeColor(
    storefrontTheme?.globalSoftText,
    brandText,
  );
  const headerBackground = normalizeThemeColor(
    storefrontTheme?.headerBackground,
    brandSurface,
  );
  const headerText = normalizeThemeColor(
    storefrontTheme?.headerText,
    brandText,
  );
  const headerButtonBorder = normalizeThemeColor(
    storefrontTheme?.headerButtonBorder,
    brandAccent,
  );
  const welcomeBackground = normalizeThemeColor(
    storefrontTheme?.welcomeBackground,
    "#FFFFFF",
  );
  const welcomeLabel = normalizeThemeColor(
    storefrontTheme?.welcomeLabel,
    brandAccent,
  );
  const welcomeHeadingColor = normalizeThemeColor(
    storefrontTheme?.welcomeHeading,
    brandPrimary,
  );
  const welcomeBody = normalizeThemeColor(
    storefrontTheme?.welcomeBody,
    brandText,
  );
  const welcomeBorder = normalizeThemeColor(
    storefrontTheme?.welcomeBorder,
    brandBorder,
  );
  const welcomeShadow = normalizeThemeColor(
    storefrontTheme?.welcomeShadow,
    brandAccent,
  );
  const welcomeActionText = normalizeThemeColor(
    storefrontTheme?.welcomeActionText,
    welcomeHeadingColor,
  );
  const welcomeActionIconText = normalizeThemeColor(
    storefrontTheme?.welcomeActionIconText,
    "#FFFFFF",
  );
  const welcomeActionIconBackground = normalizeThemeColor(
    storefrontTheme?.welcomeActionIconBackground,
    brandAccent,
  );
  const welcomeActionBorder = normalizeThemeColor(
    storefrontTheme?.welcomeActionBorder,
    "#FFFFFF",
  );
  const rewardsPopupBackground = softerPanelColor(
    storefrontTheme?.rewardsPopupBackground,
    "#FFFDF8",
    0.55,
  );
  const rewardsPopupHeaderBackground = softerPanelColor(
    storefrontTheme?.rewardsPopupHeaderBackground,
    brandAccent,
    0.78,
  );
  const rewardsPopupHeaderBlend = softerPanelColor(
    storefrontTheme?.rewardsPopupHeaderBlend,
    brandSurface,
    0.5,
  );
  const rewardsPopupHeaderText = readableTextFor(
    rewardsPopupHeaderBackground,
    normalizeThemeColor(storefrontTheme?.rewardsPopupHeaderText, brandPrimary),
    brandPrimary,
  );
  const rewardsPopupBodyText = readableTextFor(
    rewardsPopupBackground,
    normalizeThemeColor(storefrontTheme?.rewardsPopupBodyText, brandText),
    brandText,
  );
  const rewardsPopupCardBackground = softerPanelColor(
    storefrontTheme?.rewardsPopupCardBackground,
    brandSurface,
    0.42,
  );
  const rewardsPopupCardBorder = blendHex(
    normalizeThemeColor(storefrontTheme?.rewardsPopupCardBorder, brandBorder),
    "#FFFFFF",
    0.28,
  );
  const rewardsPopupPillBackground = blendHex(
    normalizeThemeColor(
      storefrontTheme?.rewardsPopupPillBackground,
      brandAccent,
    ),
    "#FFFFFF",
    0.18,
  );
  const rewardsPopupPillText = readableTextFor(
    rewardsPopupPillBackground,
    normalizeThemeColor(storefrontTheme?.rewardsPopupPillText, "#FFFFFF"),
    brandPrimary,
  );
  const rewardsPopupTopEdge = normalizeThemeColor(
    storefrontTheme?.rewardsPopupTopEdge,
    brandAccent,
  );
  const rewardsPopupLabelText = normalizeThemeColor(
    storefrontTheme?.rewardsPopupLabelText,
    brandAccent,
  );
  const rewardsPopupProgressBackground = normalizeThemeColor(
    storefrontTheme?.rewardsPopupProgressBackground,
    "#E5E7EB",
  );
  const rewardsPopupProgressFill = normalizeThemeColor(
    storefrontTheme?.rewardsPopupProgressFill,
    brandAccent,
  );
  const rewardsPopupFooterBackground = normalizeThemeColor(
    storefrontTheme?.rewardsPopupFooterBackground,
    rewardsPopupBackground,
  );
  const rewardsPopupFooterBorder = normalizeThemeColor(
    storefrontTheme?.rewardsPopupFooterBorder,
    rewardsPopupCardBorder,
  );
  const rewardsPopupButtonBackground = normalizeThemeColor(
    storefrontTheme?.rewardsPopupButtonBackground,
    rewardsPopupPillBackground,
  );
  const rewardsPopupButtonText = readableTextFor(
    rewardsPopupButtonBackground,
    normalizeThemeColor(storefrontTheme?.rewardsPopupButtonText, "#FFFFFF"),
    brandPrimary,
  );
  const rewardsPopupCloseBackground = normalizeThemeColor(
    storefrontTheme?.rewardsPopupCloseBackground,
    "#FFFFFF",
  );
  const rewardsPopupCloseText = normalizeThemeColor(
    storefrontTheme?.rewardsPopupCloseText,
    brandPrimary,
  );
  const offersPopupBackground = softerPanelColor(
    storefrontTheme?.offersPopupBackground,
    "#FFFDF8",
    0.55,
  );
  const offersPopupHeaderBackground = softerPanelColor(
    storefrontTheme?.offersPopupHeaderBackground,
    brandAccent,
    0.78,
  );
  const offersPopupHeaderBlend = softerPanelColor(
    storefrontTheme?.offersPopupHeaderBlend,
    brandSurface,
    0.5,
  );
  const offersPopupHeaderText = readableTextFor(
    offersPopupHeaderBackground,
    normalizeThemeColor(storefrontTheme?.offersPopupHeaderText, brandPrimary),
    brandPrimary,
  );
  const offersPopupBodyText = readableTextFor(
    offersPopupBackground,
    normalizeThemeColor(storefrontTheme?.offersPopupBodyText, brandText),
    brandText,
  );
  const offersPopupCardBackground = softerPanelColor(
    storefrontTheme?.offersPopupCardBackground,
    brandSurface,
    0.42,
  );
  const offersPopupCardBorder = blendHex(
    normalizeThemeColor(storefrontTheme?.offersPopupCardBorder, brandBorder),
    "#FFFFFF",
    0.28,
  );
  const offersPopupPillBackground = blendHex(
    normalizeThemeColor(
      storefrontTheme?.offersPopupPillBackground,
      brandAccent,
    ),
    "#FFFFFF",
    0.18,
  );
  const offersPopupPillText = readableTextFor(
    offersPopupPillBackground,
    normalizeThemeColor(storefrontTheme?.offersPopupPillText, "#FFFFFF"),
    brandPrimary,
  );
  const offersPopupTopEdge = normalizeThemeColor(
    storefrontTheme?.offersPopupTopEdge,
    brandAccent,
  );
  const offersPopupLabelText = normalizeThemeColor(
    storefrontTheme?.offersPopupLabelText,
    brandAccent,
  );
  const offersPopupFooterBackground = normalizeThemeColor(
    storefrontTheme?.offersPopupFooterBackground,
    offersPopupBackground,
  );
  const offersPopupFooterBorder = normalizeThemeColor(
    storefrontTheme?.offersPopupFooterBorder,
    offersPopupCardBorder,
  );
  const offersPopupButtonBackground = normalizeThemeColor(
    storefrontTheme?.offersPopupButtonBackground,
    offersPopupPillBackground,
  );
  const offersPopupButtonText = readableTextFor(
    offersPopupButtonBackground,
    normalizeThemeColor(storefrontTheme?.offersPopupButtonText, "#FFFFFF"),
    brandPrimary,
  );
  const offersPopupCloseBackground = normalizeThemeColor(
    storefrontTheme?.offersPopupCloseBackground,
    "#FFFFFF",
  );
  const offersPopupCloseText = normalizeThemeColor(
    storefrontTheme?.offersPopupCloseText,
    brandPrimary,
  );
  const footerBackground = normalizeThemeColor(
    storefrontTheme?.footerBackground,
    "#FFFFFF",
  );
  const footerText = normalizeThemeColor(
    storefrontTheme?.footerText,
    brandText,
  );
  const footerBadgeBackground = normalizeThemeColor(
    storefrontTheme?.footerBadgeBackground,
    brandAccent,
  );
  const favouritesBackground = normalizeThemeColor(
    storefrontTheme?.favouritesBackground,
    "#451A03",
  );
  const favouritesBorder = normalizeThemeColor(
    storefrontTheme?.favouritesBorder,
    brandAccent,
  );
  const favouritesText = normalizeThemeColor(
    storefrontTheme?.favouritesText,
    "#FFFFFF",
  );
  const favouritesLabelText = normalizeThemeColor(
    storefrontTheme?.favouritesLabelText,
    "#FDE68A",
  );
  const brandAccentBorder = welcomeBorder;
  const phoneHref = cleanDialString(contactPhone)
    ? `tel:${cleanDialString(contactPhone)}`
    : null;
  const whatsAppHref = cleanWhatsAppNumber(contactWhatsApp || contactPhone)
    ? `https://wa.me/${cleanWhatsAppNumber(contactWhatsApp || contactPhone)}`
    : null;
  const emailHref = contactEmail?.trim()
    ? `mailto:${contactEmail.trim()}`
    : null;
  const footerIconLinks = [
    { label: "Call store", href: phoneHref, icon: <PhoneIcon /> },
    { label: "WhatsApp store", href: whatsAppHref, icon: <WhatsAppIcon /> },
    { label: "Email store", href: emailHref, icon: <EmailIcon /> },
    {
      label: "Facebook",
      href: normaliseExternalUrl(socialFacebookUrl),
      icon: <FacebookIcon />,
    },
    {
      label: "Instagram",
      href: normaliseExternalUrl(socialInstagramUrl),
      icon: <InstagramIcon />,
    },
    {
      label: "TikTok",
      href: normaliseExternalUrl(socialTikTokUrl),
      icon: <TikTokIcon />,
    },
    { label: "X", href: normaliseExternalUrl(socialXUrl), icon: <XIcon /> },
    {
      label: "Website",
      href: normaliseExternalUrl(socialWebsiteUrl),
      icon: <WebsiteIcon />,
    },
  ]
    .filter((item) => Boolean(item.href))
    .slice(0, 8);
  const referralSignupHref = `https://www.orduva.com/?ref_tenant=${encodeURIComponent(tenantSlug)}&ref=${encodeURIComponent(`tenant_${tenantSlug}`)}&ref_source=storefront_footer`;
  const affiliateApplicationHref = `https://www.orduva.com/affiliate/apply?ref_tenant=${encodeURIComponent(tenantSlug)}&ref_source=storefront_footer_affiliate`;
  const storefrontRewardsEnabled = rewardsEnabled === true;
  const rewardProgrammeName =
    String(rewardsProgramName || "Rewards Club").trim() || "Rewards Club";
  const storefrontDiscountRules = useMemo(
    () => normalizeDiscountRules(discountRules || []),
    [discountRules],
  );
  const storefrontDiscountsEnabled = discountsEnabled === true;
  const invoicePaymentOptions = useMemo<InvoicePaymentOption[]>(() => {
    const options: InvoicePaymentOption[] = [];
    if (invoicePaymentsInvoiceEnabled !== false) {
      options.push({
        id: "invoice",
        title: "Pay Your Invoice",
        description:
          "Enter your invoice number and the exact amount you would like to pay.",
        referenceLabel: "Invoice number",
        amountLabel: "Amount to pay",
        minAmount: 1,
      });
    }
    if (invoicePaymentsDepositEnabled !== false) {
      options.push({
        id: "deposit",
        title: "Pay a Deposit",
        description: "Pay a deposit using the reference supplied by the store.",
        referenceLabel: "Deposit reference",
        amountLabel: "Deposit amount",
        minAmount: 1,
      });
    }
    if (invoicePaymentsBalanceEnabled !== false) {
      options.push({
        id: "statement_balance",
        title: "Pay Statement Balance",
        description:
          "Pay the outstanding balance shown on your account statement.",
        referenceLabel: "Statement or account reference",
        amountLabel: "Amount to pay",
        minAmount: 1,
      });
    }
    return options;
  }, [
    invoicePaymentsInvoiceEnabled,
    invoicePaymentsDepositEnabled,
    invoicePaymentsBalanceEnabled,
  ]);
  const normalStorefrontProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          !(
            product.product_type === "customer_amount" ||
            product.custom_amount_enabled === true
          ),
      ),
    [products],
  );
  const showInvoicePaymentsSection =
    invoicePaymentsEnabled === true && invoicePaymentOptions.length > 0;
  const visibleDiscountRules = useMemo(
    () =>
      storefrontDiscountRules.filter(
        (rule) => rule.isActive !== false && rule.showOnCheckout !== false,
      ),
    [storefrontDiscountRules],
  );
  const popupDiscountRules = useMemo(
    () =>
      visibleDiscountRules
        .filter((rule) => rule.popupEnabled === true)
        .slice(0, 4),
    [visibleDiscountRules],
  );

  useEffect(() => {
    if (
      !storefrontDiscountsEnabled ||
      !discountPopupEnabled ||
      discountPopupSeen ||
      !popupDiscountRules.length
    )
      return;
    const timer = window.setTimeout(() => {
      setDiscountsModalOpen(true);
      setDiscountPopupSeen(true);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [
    storefrontDiscountsEnabled,
    discountPopupEnabled,
    discountPopupSeen,
    popupDiscountRules.length,
  ]);
  const rewardTier = customerRewards?.tierLabel || "Silver";
  const rewardTierPalette = getRewardTierPalette(rewardTier);
  const rewardDiscount = Number(
    customerRewards?.discountPercent ||
      (rewardTier === "Platinum"
        ? rewardsPlatinumDiscountPercent
        : rewardTier === "Gold"
          ? rewardsGoldDiscountPercent
          : rewardsSilverDiscountPercent) ||
      0,
  );
  const rewardSpendToNext = Number(customerRewards?.spendToNextTier || 0);
  const rewardNextTier = customerRewards?.nextTierLabel || null;
  const rewardProgress = Math.max(
    0,
    Math.min(100, Number(customerRewards?.progressPercent || 0)),
  );

  const refreshCustomerSession = useCallback(
    async (options?: { initial?: boolean }) => {
      const fetchCustomer = async (timeoutMs: number) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
          const res = await fetch(`/api/customer/auth/me?ts=${Date.now()}`, {
            cache: "no-store",
            credentials: "include",
            headers: { "Cache-Control": "no-cache" },
            signal: controller.signal,
          });
          const data = await res.json().catch(() => ({}));
          return { res, data };
        } finally {
          window.clearTimeout(timeout);
        }
      };

      const applySignedOut = () => {
        setWelcomeCustomerName(null);
        setCustomerRewards(null);
        setCustomerAuthStatus("signedOut");
        setFavouritesSignedIn(false);
        setFavouriteIds([]);
        setFavouritesMessage(null);
        setBuyAgainIds([]);
        setBuyAgainMessage(null);
      };

      try {
        if (options?.initial) setCustomerAuthStatus("checking");
        let result;
        try {
          result = await fetchCustomer(5500);
        } catch {
          await new Promise((resolve) => window.setTimeout(resolve, 850));
          result = await fetchCustomer(10000);
        }

        const { res, data } = result;
        if (res.ok && data?.customer) {
          const fullName = String(data.customer.fullName || "").trim();
          const email = String(data.customer.email || "").trim();
          const firstName =
            fullName.split(/\s+/).filter(Boolean)[0] ||
            email.split("@")[0] ||
            null;
          setWelcomeCustomerName(firstName);
          setCustomerRewards(data.customer.rewards || null);
          setCustomerAuthStatus("signedIn");
          setFavouritesSignedIn(true);
        } else {
          applySignedOut();
        }
      } catch {
        // Installed PWAs can resume from a cached shell before cookies/API calls are
        // ready. Do not permanently hide customer, favourites, or Buy Again after a
        // transient startup miss; keep any previous signed-in state and retry when
        // the app becomes visible/focused.
        setCustomerAuthStatus((current) =>
          current === "checking" ? "signedOut" : current,
        );
      }
    },
    [],
  );

  useEffect(() => {
    void refreshCustomerSession({ initial: true });

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshCustomerSession();
    };
    const refreshOnPageShow = () => {
      void refreshCustomerSession();
    };

    window.addEventListener("focus", refreshOnPageShow);
    window.addEventListener("pageshow", refreshOnPageShow);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshOnPageShow);
      window.removeEventListener("pageshow", refreshOnPageShow);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshCustomerSession]);

  useEffect(() => {
    let cancelled = false;

    if (customerAuthStatus === "checking") {
      setFavouritesReady(false);
      return () => {
        cancelled = true;
      };
    }

    if (customerAuthStatus === "signedOut") {
      setFavouriteIds([]);
      setFavouritesSignedIn(false);
      setFavouritesMessage(null);
      setFavouritesVisible(false);
      setFavouritesReady(true);
      setBuyAgainIds([]);
      setBuyAgainMessage(null);
      setBuyAgainVisible(false);
      setBuyAgainReady(true);
      return () => {
        cancelled = true;
      };
    }

    async function loadFavourites() {
      setFavouritesReady(false);
      setFavouritesSignedIn(true);
      try {
        const res = await fetch("/api/customer/favourites", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && Array.isArray(data?.productIds)) {
          setFavouriteIds(
            data.productIds.map((id: unknown) => String(id)).filter(Boolean),
          );
          setFavouritesSignedIn(true);
          setFavouritesMessage(null);
        } else if (res.status === 401) {
          setFavouriteIds([]);
          setFavouritesSignedIn(false);
          setCustomerAuthStatus("signedOut");
          setFavouritesMessage(null);
        } else {
          setFavouritesMessage(
            String(data?.error || "Favourites could not be loaded."),
          );
        }
      } catch {
        if (!cancelled) setFavouritesMessage("Favourites could not be loaded.");
      } finally {
        if (!cancelled) setFavouritesReady(true);
      }
    }

    void loadFavourites();

    return () => {
      cancelled = true;
    };
  }, [customerAuthStatus]);

  useEffect(() => {
    let cancelled = false;

    if (customerAuthStatus === "checking") {
      setBuyAgainReady(false);
      return () => {
        cancelled = true;
      };
    }

    if (customerAuthStatus === "signedOut") {
      setBuyAgainIds([]);
      setBuyAgainMessage(null);
      setBuyAgainVisible(false);
      setBuyAgainReady(true);
      return () => {
        cancelled = true;
      };
    }

    async function loadBuyAgain() {
      setBuyAgainReady(false);
      try {
        const res = await fetch("/api/customer/buy-again", {
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && Array.isArray(data?.productIds)) {
          setBuyAgainIds(
            data.productIds.map((id: unknown) => String(id)).filter(Boolean),
          );
          setBuyAgainMessage(null);
        } else if (res.status === 401) {
          setBuyAgainIds([]);
          setCustomerAuthStatus("signedOut");
          setBuyAgainMessage(null);
        } else {
          setBuyAgainMessage(
            String(data?.error || "Previous purchases could not be loaded."),
          );
        }
      } catch {
        if (!cancelled)
          setBuyAgainMessage("Previous purchases could not be loaded.");
      } finally {
        if (!cancelled) setBuyAgainReady(true);
      }
    }

    void loadBuyAgain();

    return () => {
      cancelled = true;
    };
  }, [customerAuthStatus]);

  const favouriteProducts = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, product]));
    return favouriteIds.map((id) => byId.get(id)).filter(Boolean) as Product[];
  }, [favouriteIds, products]);

  const buyAgainProducts = useMemo(() => {
    const byId = new Map(products.map((product) => [product.id, product]));
    return buyAgainIds.map((id) => byId.get(id)).filter(Boolean) as Product[];
  }, [buyAgainIds, products]);

  // Ver-0.172B: keep favourites hidden by default, but let signed-in customers
  // reveal/hide them from the welcome panel. Favourite IDs still load quietly so
  // product hearts can show saved state without auto-opening the strip.
  const showFavouriteLoadingNote =
    customerAuthStatus === "signedIn" && !favouritesReady;
  const canToggleFavourites =
    customerAuthStatus === "signedIn" &&
    favouritesReady &&
    favouriteProducts.length > 0;
  const canToggleBuyAgain =
    customerAuthStatus === "signedIn" &&
    buyAgainReady &&
    buyAgainProducts.length > 0;
  const showNoFavouritesNote =
    customerAuthStatus === "signedIn" &&
    favouritesReady &&
    !favouritesMessage &&
    favouriteProducts.length === 0;
  const shouldRenderFavouritesArea =
    customerAuthStatus === "signedIn" && favouritesVisible;
  const shouldRenderBuyAgainArea =
    customerAuthStatus === "signedIn" && buyAgainVisible;
  const customerPersonalChromeReady =
    customerAuthStatus !== "checking" &&
    (customerAuthStatus !== "signedIn" || (favouritesReady && buyAgainReady));
  const hasWelcomeActions =
    storefrontRewardsEnabled ||
    storefrontDiscountsEnabled ||
    canToggleFavourites ||
    canToggleBuyAgain;
  const rewardsActionVisible =
    welcomeActionsStage >= 1 && storefrontRewardsEnabled;
  const compactActionsVisible =
    welcomeActionsStage >= 2 &&
    (storefrontDiscountsEnabled || canToggleFavourites || canToggleBuyAgain);
  const rewardPanelTitle =
    customerAuthStatus === "signedIn" ? `Rewards - ${rewardTier}` : "Rewards";
  const rewardPanelHelper =
    customerAuthStatus === "signedIn"
      ? rewardNextTier
        ? `Spend ${formatMoney(rewardSpendToNext, moneySettings)} more for ${rewardNextTier}`
        : "Top tier unlocked"
      : "Sign in to unlock rewards";

  useEffect(() => {
    setWelcomeActionsStage(0);
    if (!customerPersonalChromeReady) return;
    const rewardsTimer = window.setTimeout(
      () => setWelcomeActionsStage(1),
      hasWelcomeActions ? 100 : 0,
    );
    const compactTimer = window.setTimeout(
      () => setWelcomeActionsStage(2),
      hasWelcomeActions ? 340 : 0,
    );
    return () => {
      window.clearTimeout(rewardsTimer);
      window.clearTimeout(compactTimer);
    };
  }, [
    customerPersonalChromeReady,
    hasWelcomeActions,
    storefrontRewardsEnabled,
    storefrontDiscountsEnabled,
    canToggleFavourites,
    canToggleBuyAgain,
  ]);

  useEffect(() => {
    if (!customerPersonalChromeReady) return;
    if (hasWelcomeActions && welcomeActionsStage < 2) return;
    const frame = window.requestAnimationFrame(() =>
      onFirstMeaningfulPaintReady?.(),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [
    customerPersonalChromeReady,
    hasWelcomeActions,
    welcomeActionsStage,
    onFirstMeaningfulPaintReady,
  ]);

  const favouriteIdSet = useMemo(() => new Set(favouriteIds), [favouriteIds]);

  function scrollProductStrip(
    stripRef: { current: HTMLDivElement | null },
    direction: "left" | "right",
  ) {
    const strip = stripRef.current;
    if (!strip) return;
    const firstCard = strip.querySelector("article");
    const cardWidth =
      firstCard instanceof HTMLElement ? firstCard.offsetWidth : 248;
    strip.scrollBy({
      left: direction === "left" ? -(cardWidth + 16) : cardWidth + 16,
      behavior: "smooth",
    });
  }

  function scrollFavourites(direction: "left" | "right") {
    scrollProductStrip(favouritesStripRef, direction);
  }

  function scrollBuyAgain(direction: "left" | "right") {
    scrollProductStrip(buyAgainStripRef, direction);
  }

  async function toggleFavourite(productId: string) {
    if (favouriteBusyById[productId]) return;
    if (customerAuthStatus !== "signedIn" || !favouritesSignedIn) {
      setFavouritesMessage(null);
      setFavouriteLoginPromptOpen(true);
      return;
    }

    const isFavourite = favouriteIdSet.has(productId);
    setFavouriteBusyById((current) => ({ ...current, [productId]: true }));
    setFavouritesMessage(null);

    const previousIds = favouriteIds;
    setFavouriteIds((current) =>
      isFavourite
        ? current.filter((id) => id !== productId)
        : [productId, ...current.filter((id) => id !== productId)],
    );

    try {
      const res = await fetch(
        isFavourite
          ? `/api/customer/favourites?productId=${encodeURIComponent(productId)}`
          : "/api/customer/favourites",
        {
          method: isFavourite ? "DELETE" : "POST",
          headers: isFavourite
            ? undefined
            : { "Content-Type": "application/json" },
          body: isFavourite ? undefined : JSON.stringify({ productId }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFavouriteIds(previousIds);
        if (res.status === 401) setFavouritesSignedIn(false);
        const detail = [
          data?.error,
          data?.details,
          data?.code ? `Code: ${data.code}` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        setFavouritesMessage(
          String(detail || "Favourite could not be updated."),
        );
        window.setTimeout(() => setFavouritesMessage(null), 4500);
      }
    } catch {
      setFavouriteIds(previousIds);
      setFavouritesMessage("Favourite could not be updated.");
      window.setTimeout(() => setFavouritesMessage(null), 3000);
    } finally {
      setFavouriteBusyById((current) => ({ ...current, [productId]: false }));
    }
  }

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalStorefrontProducts.filter((product) => {
      const categoryName =
        categories.find((category) => category.id === product.category_id)
          ?.name || "";
      const matchesCategory =
        activeCategoryId === "all" ||
        product.category_id === activeCategoryId ||
        product.secondary_category_id === activeCategoryId;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        product.name,
        stripHtml(product.description),
        categoryName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalStorefrontProducts, categories, query, activeCategoryId]);

  useEffect(() => {
    const getCount = (items: StoredCartItem[]) =>
      items.reduce((total, item) => total + Math.max(0, item.quantity || 0), 0);
    const update = (items: StoredCartItem[]) => setCartCount(getCount(items));

    update(readCart<StoredCartItem>(tenantSlug));
    return subscribeToCartUpdates<StoredCartItem>(tenantSlug, update);
  }, [tenantSlug]);

  useEffect(() => {
    const hasBlockingOverlay =
      searchOpen ||
      rewardsModalOpen ||
      discountsModalOpen ||
      favouriteLoginPromptOpen;
    if (!hasBlockingOverlay) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
    };
  }, [
    searchOpen,
    rewardsModalOpen,
    discountsModalOpen,
    favouriteLoginPromptOpen,
  ]);

  const triggerCartPulse = useCallback(() => {
    setCartPulseKey((current) => current + 1);
  }, []);

  const launchAddToCartAnimation = useCallback(
    ({
      imageUrl,
      name,
      sourceRect,
      targetRect,
      destination = "header",
    }: {
      imageUrl: string | null;
      name: string;
      sourceRect: DOMRect | null;
      targetRect?: DOMRect | null;
      destination?: "header" | "search";
    }) => {
      const targetElement =
        destination === "search" && searchCartIndicatorRef.current
          ? searchCartIndicatorRef.current
          : cartButtonRef.current;
      const resolvedTargetRect =
        targetRect ?? targetElement?.getBoundingClientRect() ?? null;
      if (!sourceRect || !resolvedTargetRect) {
        triggerCartPulse();
        return;
      }
      const id = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextItem: FlyingCartItem = {
        id,
        name,
        imageUrl,
        startLeft: sourceRect.left,
        startTop: sourceRect.top,
        startWidth: sourceRect.width,
        startHeight: sourceRect.height,
        endCenterX: resolvedTargetRect.left + resolvedTargetRect.width / 2,
        endCenterY: resolvedTargetRect.top + resolvedTargetRect.height / 2,
        started: false,
      };

      setFlyingItems((current) => [...current, nextItem]);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setFlyingItems((current) =>
            current.map((item) =>
              item.id === id ? { ...item, started: true } : item,
            ),
          );
        });
      });

      window.setTimeout(() => {
        setFlyingItems((current) => current.filter((item) => item.id !== id));
        triggerCartPulse();
      }, 2000);
    },
    [triggerCartPulse],
  );

  function trackStorefrontProductEvent(
    eventType: string,
    product: Product | undefined,
    source: string,
  ) {
    if (typeof window === "undefined" || !product) return;
    window.dispatchEvent(
      new CustomEvent("orduva:analytics", {
        detail: {
          eventType,
          scope: "tenant_storefront",
          tenantId,
          tenantSlug,
          productId: product.id,
          productName: product.name,
          metadata: { source },
        },
      }),
    );
  }

  function activeProductVariants(product: Product | undefined) {
    return (
      Array.isArray(product?.product_variants) ? product!.product_variants! : []
    ).filter(
      (variant) =>
        variant &&
        variant.isActive !== false &&
        String(variant.name || "").trim(),
    );
  }

  async function addCartLine(
    productId: string,
    variant: ProductVariant | null,
    options?: {
      sourceRect?: DOMRect | null;
      imageUrl?: string | null;
      name?: string;
      targetRect?: DOMRect | null;
      destination?: "header" | "search";
    },
  ) {
    if (buttonStateById[productId] === "adding") return;

    const product = products.find((item) => item.id === productId);
    const stockState = variantStockState(product, variant);
    if (stockState.outOfStock) return;

    const existing = readCart<StoredCartItem>(tenantSlug);
    const lineIdentity = { productId, variantId: variant?.id || null };
    const found = existing.find(
      (item) => cartLineKey(item) === cartLineKey(lineIdentity),
    );
    const lineCurrentQuantity = found
      ? Math.max(0, Number(found.quantity || 0))
      : 0;
    if (stockState.tracked && lineCurrentQuantity >= stockState.available) {
      setButtonStateById((current) => ({ ...current, [productId]: "added" }));
      window.setTimeout(() => {
        setButtonStateById((current) => ({ ...current, [productId]: "idle" }));
      }, 1200);
      return;
    }

    setButtonStateById((current) => ({ ...current, [productId]: "adding" }));
    trackStorefrontProductEvent(
      "add_to_cart",
      product,
      options?.destination === "search" ? "search_popup" : "storefront_menu",
    );
    if (options?.sourceRect || options?.imageUrl || options?.name) {
      launchAddToCartAnimation({
        imageUrl: options?.imageUrl ?? product?.image_url ?? null,
        name: options?.name ?? product?.name ?? "Menu item",
        sourceRect: options?.sourceRect ?? null,
        targetRect: options?.targetRect ?? null,
        destination: options?.destination ?? "header",
      });
    }

    const cappedNextQuantity = stockState.tracked
      ? stockState.available
      : Number.POSITIVE_INFINITY;
    const updated = found
      ? existing.map((item) =>
          cartLineKey(item) === cartLineKey(lineIdentity)
            ? {
                ...item,
                quantity: stockState.tracked
                  ? Math.min(item.quantity + 1, cappedNextQuantity)
                  : item.quantity + 1,
              }
            : item,
        )
      : [
          ...existing,
          {
            productId,
            quantity: 1,
            unitPrice: variant && product ? Number(getVariantPrice(Number(product.price || 0), variant).toFixed(2)) : Number(Number(product?.price || 0).toFixed(2)),
            basePrice: Number(Number(product?.price || 0).toFixed(2)),
            variantId: variant?.id || null,
            variantName: variant?.name || null,
            variantLabel: variant ? product?.variant_label || "Option" : null,
            variantPriceDelta:
              variant && product
                ? getVariantPriceDeltaForCart(
                    Number(product.price || 0),
                    variant,
                  )
                : 0,
            variantPrice:
              variant && product
                ? Number(
                    getVariantPrice(
                      Number(product.price || 0),
                      variant,
                    ).toFixed(2),
                  )
                : null,
            variantDescription: variant?.description || null,
            variantStockEnabled: variant
              ? variant.stockEnabled === true
              : !!product?.stock_enabled,
          },
        ];

    writeCart(tenantSlug, updated);

    setButtonStateById((current) => ({ ...current, [productId]: "added" }));
    window.setTimeout(() => {
      setButtonStateById((current) => ({ ...current, [productId]: "idle" }));
    }, 1200);
  }

  async function addToCart(
    productId: string,
    options?: {
      sourceRect?: DOMRect | null;
      imageUrl?: string | null;
      name?: string;
      targetRect?: DOMRect | null;
      destination?: "header" | "search";
    },
  ) {
    const product = products.find((item) => item.id === productId);
    if (
      product?.product_type === "customer_amount" ||
      product?.custom_amount_enabled === true
    ) {
      setCustomAmountPickerProduct({ product, options });
      setCustomAmountValue("");
      setCustomAmountReference("");
      setCustomAmountNote("");
      setCustomAmountError("");
      return;
    }
    const variants = activeProductVariants(product);
    if (product?.variants_enabled && variants.length) {
      setVariantPickerProduct({
        product,
        source:
          options?.destination === "search"
            ? "search_popup"
            : "storefront_menu",
        options,
      });
      return;
    }

    await addCartLine(productId, null, options);
  }

  async function startStandaloneCustomerPayment() {
    if (!customAmountPickerProduct || customAmountSubmitting) return;
    const option = customAmountPickerProduct.product as Product;
    const amount = Number(String(customAmountValue || "").replace(/,/g, ""));
    const minAmount = Math.max(0, Number(option.custom_amount_min ?? 1));
    const reference = customAmountReference.trim();
    const customerName = customAmountCustomerName.trim();
    const customerPhone = customAmountCustomerPhone.trim();
    if (!customerName) {
      setCustomAmountError("Please enter your name.");
      return;
    }
    if (!customerPhone) {
      setCustomAmountError("Please enter your phone number.");
      return;
    }
    if (!reference) {
      setCustomAmountError("Please enter the payment reference.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount < minAmount) {
      setCustomAmountError(
        `Please enter an amount of at least ${formatMoney(minAmount, moneySettings)}.`,
      );
      return;
    }
    setCustomAmountError("");
    setCustomAmountSubmitting(true);
    try {
      const res = await fetch("/api/storefront/invoice-payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          tenantId,
          paymentType: option.id,
          customerName,
          customerPhone,
          reference,
          amount,
          note: customAmountNote.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok)
        throw new Error(String(data?.error || "Payment could not be started."));
      const redirectUrl =
        data.stripeCheckoutUrl ||
        data.yocoCheckoutUrl ||
        data.mpesaCheckoutUrl ||
        data.darajaCheckoutUrl;
      if (!redirectUrl)
        throw new Error("Payment provider did not return a payment link.");
      window.location.href = redirectUrl;
    } catch (error) {
      setCustomAmountError(
        error instanceof Error
          ? error.message
          : "Payment could not be started.",
      );
      setCustomAmountSubmitting(false);
    }
  }

  function openStandalonePayment(option: InvoicePaymentOption) {
    setCustomAmountPickerProduct({
      product: {
        id: option.id,
        category_id: "invoice-payments",
        name: option.title,
        description: option.description,
        image_url: null,
        price: 0,
        is_active: true,
        product_type: "customer_amount",
        custom_amount_enabled: true,
        custom_amount_label: option.amountLabel,
        custom_amount_reference_label: option.referenceLabel,
        custom_amount_reference_required: true,
        custom_amount_min: option.minAmount,
        custom_amount_max: null,
        custom_amount_help_text: option.description,
        custom_amount_disable_rewards: true,
        custom_amount_disable_discounts: true,
      },
    });
    setCustomAmountValue("");
    setCustomAmountReference("");
    setCustomAmountNote("");
    setCustomAmountCustomerName("");
    setCustomAmountCustomerPhone("");
    setCustomAmountError("");
    setCustomAmountSubmitting(false);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div
        className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
        aria-hidden="true"
      >
        {flyingItems.map((item) => {
          const targetX =
            item.endCenterX - (item.startLeft + item.startWidth / 2);
          const targetY =
            item.endCenterY - (item.startTop + item.startHeight / 2);
          return (
            <div
              key={item.id}
              className="absolute left-0 top-0 will-change-transform"
              style={{
                width: item.startWidth,
                height: item.startHeight,
                transform: item.started
                  ? `translate3d(${item.startLeft + targetX}px, ${item.startTop + targetY}px, 0) scale(0.18) rotate(14deg)`
                  : `translate3d(${item.startLeft}px, ${item.startTop}px, 0) scale(1) rotate(0deg)`,
                opacity: item.started ? 0.16 : 1,
                transition:
                  "transform 2000ms cubic-bezier(0.2, 0.9, 0.2, 1), opacity 2000ms ease, filter 2000ms ease, box-shadow 2000ms ease",
                filter: item.started ? "blur(1px) saturate(1.05)" : "blur(0px)",
                boxShadow: item.started
                  ? "0 24px 56px rgba(15,23,42,0.08)"
                  : "0 30px 74px rgba(15,23,42,0.18)",
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-[28px] border border-white/90 bg-white/98 shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
                <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.52),transparent_58%)]" />
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-contain bg-white p-3"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 text-4xl">
                    📦
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="sticky top-0 z-40 -mx-4 sm:-mx-5 lg:-mx-6 before:absolute before:inset-x-0 before:bottom-full before:h-16 before:content-['']"
        style={{ backgroundColor: brandSurface }}
      >
        <div
          className="border-b shadow-[0_22px_60px_rgba(15,23,42,0.10)]"
          style={{ borderColor: brandBorder, background: headerBackground }}
        >
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-5 sm:py-5.5 lg:px-6 lg:py-6">
            <div className="relative flex min-h-[78px] items-center justify-center sm:min-h-[86px] lg:min-h-[94px]">
              <div className="flex min-w-0 items-center justify-center px-[58px] sm:px-0">
                {headerLogoUrl ? (
                  <img
                    src={headerLogoUrl}
                    alt={tenantName}
                    className="h-auto max-h-[46px] w-auto max-w-[min(42vw,150px)] object-contain sm:max-h-[60px] sm:max-w-[240px] lg:max-h-[68px] lg:max-w-[280px]"
                    loading="lazy"
                  />
                ) : (
                  <h1
                    className="max-w-[min(42vw,150px)] truncate text-center text-[1.35rem] font-semibold tracking-tight sm:max-w-none sm:text-[1.95rem] lg:text-[2.35rem]"
                    style={{ color: headerText }}
                  >
                    {tenantName}
                  </h1>
                )}
              </div>

              <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center gap-2 sm:hidden">
                <CustomerAccountHeaderActions />
              </div>

              <div className="absolute left-0 top-1/2 hidden -translate-y-1/2 items-center gap-2 lg:flex">
                {rewardsActionVisible ? (
                  <StorefrontQuickActionButton
                    label="Rewards"
                    actionLabel={
                      customerAuthStatus === "signedIn" ? rewardTier : "View"
                    }
                    icon={<span className="text-lg leading-none">✦</span>}
                    onClick={() => setRewardsModalOpen(true)}
                    borderColor="transparent"
                    textColor={welcomeActionText}
                    iconTextColor={welcomeActionIconText}
                    iconBackground={welcomeActionIconBackground}
                    variant="header"
                  />
                ) : null}
                {compactActionsVisible && storefrontDiscountsEnabled ? (
                  <StorefrontQuickActionButton
                    label="Offers"
                    actionLabel={visibleDiscountRules.length ? "View" : "Info"}
                    icon={
                      <span className="text-base font-black leading-none">
                        %
                      </span>
                    }
                    onClick={() => setDiscountsModalOpen(true)}
                    borderColor="transparent"
                    textColor={welcomeActionText}
                    iconTextColor={welcomeActionIconText}
                    iconBackground={welcomeActionIconBackground}
                    variant="header"
                  />
                ) : null}
                {compactActionsVisible && canToggleFavourites ? (
                  <StorefrontQuickActionButton
                    label="Favourites"
                    actionLabel={favouritesVisible ? "Hide" : "View"}
                    icon={
                      <svg
                        viewBox="0 0 24 24"
                        className="h-[18px] w-[18px]"
                        fill={favouritesVisible ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />
                      </svg>
                    }
                    onClick={() => setFavouritesVisible((visible) => !visible)}
                    expanded={favouritesVisible}
                    controls="customer-favourites-section"
                    borderColor="transparent"
                    textColor={welcomeActionText}
                    iconTextColor={welcomeActionIconText}
                    iconBackground={welcomeActionIconBackground}
                    variant="header"
                  />
                ) : null}
                {compactActionsVisible && canToggleBuyAgain ? (
                  <StorefrontQuickActionButton
                    label="Buy again"
                    actionLabel={buyAgainVisible ? "Hide" : "View"}
                    icon={<span className="text-lg leading-none">↻</span>}
                    onClick={() => setBuyAgainVisible((visible) => !visible)}
                    expanded={buyAgainVisible}
                    controls="customer-buy-again-section"
                    borderColor="transparent"
                    textColor={welcomeActionText}
                    iconTextColor={welcomeActionIconText}
                    iconBackground={welcomeActionIconBackground}
                    variant="header"
                  />
                ) : null}
              </div>

              <div className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-2 sm:gap-2.5">
                <div className="hidden sm:flex sm:items-center sm:gap-2.5">
                  <CustomerAccountHeaderActions />
                </div>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-white/95 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:bg-white sm:h-11 sm:w-11"
                  style={{ borderColor: headerButtonBorder }}
                  aria-label="Search menu"
                  title="Search menu"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-[23px] w-[23px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
                <CartButton
                  ref={cartButtonRef}
                  tenantSlug={tenantSlug}
                  tenantId={tenantId}
                  accentColor={brandAccent}
                  primaryColor={brandPrimary}
                  pulseKey={cartPulseKey}
                  checkoutBlocked={Boolean(
                    trialState?.checkoutBlocked || trialState?.isTrialExpired,
                  )}
                  checkoutBlockedMessage={trialState?.customerMessage || null}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section
        className="rounded-[28px] border px-5 py-5 text-center ring-1 ring-slate-200/70 sm:px-6 sm:py-6 lg:px-8 lg:py-7"
        style={{
          backgroundColor: welcomeBackground,
          borderColor: brandAccentBorder,
          boxShadow: `0 16px 36px ${welcomeShadow}22`,
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.28em]"
          style={{ color: welcomeLabel }}
        >
          {welcomeCustomerName ? `Welcome, ${welcomeCustomerName}` : "Welcome"}
        </p>
        <h2
          className="mt-2 text-[1.75rem] font-semibold tracking-tight sm:text-[2.35rem] lg:text-[2.65rem]"
          style={{ color: welcomeHeadingColor }}
        >
          {welcomeHeading || "Browse the menu"}
        </h2>
        <p
          className="mx-auto mt-3 max-w-3xl text-[14px] leading-6 sm:text-base sm:leading-7"
          style={{ color: welcomeBody }}
        >
          {welcomeSubheading ||
            "Tap into the details for more information, or add favourites straight to your order."}
        </p>
        <div className="mt-4 flex flex-col items-center justify-center gap-2 text-center sm:hidden">
          {showFavouriteLoadingNote ? (
            <p
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-center text-[11px] font-semibold shadow-sm backdrop-blur"
              style={{ color: welcomeBody }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />
              </svg>
              Loading your saved hearts quietly in the background
            </p>
          ) : null}

          {rewardsActionVisible ? (
            <StorefrontQuickActionButton
              label={rewardPanelTitle}
              actionLabel={rewardPanelHelper}
              icon={<span className="text-xl leading-none">✦</span>}
              onClick={() => setRewardsModalOpen(true)}
              borderColor={welcomeActionBorder}
              textColor={welcomeActionText}
              iconTextColor={welcomeActionIconText}
              iconBackground={welcomeActionIconBackground}
              variant="wide"
            />
          ) : null}

          {compactActionsVisible ? (
            <div className="grid w-full max-w-[20rem] grid-cols-3 items-stretch justify-items-center gap-2">
              {storefrontDiscountsEnabled ? (
                <StorefrontQuickActionButton
                  label="Offers"
                  actionLabel={visibleDiscountRules.length ? "View" : "Info"}
                  icon={
                    <span className="text-base font-black leading-none">%</span>
                  }
                  onClick={() => setDiscountsModalOpen(true)}
                  borderColor="transparent"
                  textColor={welcomeActionText}
                  iconTextColor={welcomeActionIconText}
                  iconBackground={welcomeActionIconBackground}
                />
              ) : (
                <span aria-hidden="true" />
              )}

              {canToggleFavourites ? (
                <StorefrontQuickActionButton
                  label="Favourites"
                  actionLabel={favouritesVisible ? "Hide" : "View"}
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[18px] w-[18px]"
                      fill={favouritesVisible ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />
                    </svg>
                  }
                  onClick={() => setFavouritesVisible((visible) => !visible)}
                  expanded={favouritesVisible}
                  controls="customer-favourites-section"
                  borderColor="transparent"
                  textColor={welcomeActionText}
                  iconTextColor={welcomeActionIconText}
                  iconBackground={welcomeActionIconBackground}
                />
              ) : (
                <span aria-hidden="true" />
              )}

              {canToggleBuyAgain ? (
                <StorefrontQuickActionButton
                  label="Buy again"
                  actionLabel={buyAgainVisible ? "Hide" : "View"}
                  icon={<span className="text-lg leading-none">↻</span>}
                  onClick={() => setBuyAgainVisible((visible) => !visible)}
                  expanded={buyAgainVisible}
                  controls="customer-buy-again-section"
                  borderColor="transparent"
                  textColor={welcomeActionText}
                  iconTextColor={welcomeActionIconText}
                  iconBackground={welcomeActionIconBackground}
                />
              ) : (
                <span aria-hidden="true" />
              )}
            </div>
          ) : null}

          {showNoFavouritesNote ? (
            <p
              className="text-center text-[11px] font-semibold"
              style={{ color: welcomeBody }}
            >
              Tap the heart on any product to save it here.
            </p>
          ) : null}
        </div>
      </section>

      {discountsModalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 px-[35px] py-[75px] backdrop-blur-[2px] overscroll-none"
          role="dialog"
          aria-modal="true"
          onClick={() => setDiscountsModalOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="flex max-h-[calc(100dvh-150px)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[24px] border shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:rounded-[28px]"
              style={{
                backgroundColor: offersPopupBackground,
                borderColor: offersPopupCardBorder,
                color: offersPopupBodyText,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="sticky top-0 z-10 border-b px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-8 lg:pb-7 lg:pt-6"
                style={{
                  background: `linear-gradient(135deg, ${offersPopupHeaderBackground}, ${offersPopupHeaderBlend})`,
                  borderColor: offersPopupFooterBorder,
                  color: offersPopupHeaderText,
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${offersPopupTopEdge}, ${offersPopupHeaderBackground}, ${offersPopupTopEdge})` }}
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.24em]"
                      style={{ color: offersPopupLabelText }}
                    >
                      Offers & discount codes
                    </p>
                    <h3
                      className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.8rem]"
                      style={{ color: offersPopupHeaderText }}
                    >
                      {discountPopupTitle || "Today’s offers"}
                    </h3>
                    <p
                      className="mt-2 text-sm leading-6"
                      style={{ color: offersPopupBodyText }}
                    >
                      {discountPopupMessage ||
                        "Apply an available offer at checkout."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDiscountsModalOpen(false)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xl shadow-sm transition hover:-translate-y-[1px]"
                    style={{
                      backgroundColor: offersPopupCloseBackground,
                      borderColor: offersPopupFooterBorder,
                      color: offersPopupCloseText,
                    }}
                    aria-label="Close discounts"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-6 sm:px-6 sm:pb-11 sm:pt-7 lg:px-7 lg:pb-12 lg:pt-8 xl:px-8 xl:pb-14 xl:pt-8">
                <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr] xl:items-start xl:gap-7">
                  <div
                    className="rounded-[24px] border p-4 sm:p-5 lg:p-6"
                    style={{ backgroundColor: offersPopupCardBackground, borderColor: offersPopupCardBorder }}
                  >
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.22em]"
                      style={{ color: offersPopupLabelText }}
                    >
                      How offers work
                    </p>
                    <div className="mt-3 text-[15px] leading-7" style={{ color: offersPopupBodyText }}>
                      <p>
                        Use a discount code at checkout, or tap an available
                        offer where the store allows quick apply.
                      </p>
                      <p className="mt-3">
                        Some offers can be used with rewards, while others are
                        set as the only discount for that order.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 xl:space-y-5">
                    {!visibleDiscountRules.length ? (
                      <div
                        className="rounded-[24px] border p-4 text-center text-sm leading-6 sm:p-5 lg:p-6"
                        style={{ backgroundColor: offersPopupCardBackground, borderColor: offersPopupCardBorder, color: offersPopupBodyText }}
                      >
                        No offers are currently available. Please check again
                        soon.
                      </div>
                    ) : null}
                    {visibleDiscountRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="rounded-[24px] border p-4 shadow-sm sm:p-5 lg:p-6"
                        style={{ backgroundColor: offersPopupCardBackground, borderColor: offersPopupCardBorder, color: offersPopupBodyText }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: offersPopupLabelText }}>
                              {rule.scope === "combo"
                                ? "Bundle offer"
                                : rule.scope === "product"
                                  ? "Product offer"
                                  : "Site-wide offer"}
                            </p>
                            <h4 className="mt-2 text-lg font-semibold tracking-tight" style={{ color: offersPopupHeaderText }}>
                              {rule.name}
                            </h4>
                            <p className="mt-2 text-sm leading-6" style={{ color: offersPopupBodyText }}>
                              {rule.code
                                ? `Use code ${rule.code} at checkout.`
                                : "Applies automatically when eligible."}
                            </p>
                          </div>
                          <span
                            className="inline-flex shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1"
                            style={{ backgroundColor: offersPopupPillBackground, color: offersPopupPillText, borderColor: offersPopupCardBorder }}
                          >
                            {rule.type === "percentage"
                              ? `${rule.value}%`
                              : `${formatMoney(Number(rule.value || 0), moneySettings)}`}
                          </span>
                        </div>
                        {rule.popupMessage ? (
                          <p className="mt-3 text-sm leading-6" style={{ color: offersPopupBodyText }}>
                            {rule.popupMessage}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                className="sticky bottom-0 z-10 border-t px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8"
                style={{ backgroundColor: offersPopupFooterBackground, borderColor: offersPopupFooterBorder }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                  <button
                    type="button"
                    onClick={() => setDiscountsModalOpen(false)}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border px-7 py-3 text-sm font-semibold transition hover:-translate-y-[1px] lg:px-8"
                    style={{
                      backgroundColor: offersPopupButtonBackground,
                      borderColor: offersPopupButtonBackground,
                      color: offersPopupButtonText,
                    }}
                  >
                    Back to menu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {rewardsModalOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 px-[35px] py-[75px] backdrop-blur-[2px] overscroll-none"
          role="dialog"
          aria-modal="true"
          onClick={() => setRewardsModalOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="flex max-h-[calc(100dvh-150px)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[24px] border shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:rounded-[28px]"
              style={{
                backgroundColor: rewardsPopupBackground,
                borderColor: rewardsPopupCardBorder,
                color: rewardsPopupBodyText,
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="sticky top-0 z-10 border-b px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-8 lg:pb-7 lg:pt-6"
                style={{
                  background: `linear-gradient(135deg, ${rewardsPopupHeaderBackground}, ${rewardsPopupHeaderBlend})`,
                  borderColor: rewardsPopupFooterBorder,
                  color: rewardsPopupHeaderText,
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${rewardsPopupTopEdge}, ${rewardsPopupHeaderBackground}, ${rewardsPopupTopEdge})` }}
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.24em]"
                      style={{ color: rewardsPopupLabelText }}
                    >
                      {rewardProgrammeName}
                    </p>
                    <h3
                      className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.8rem]"
                      style={{ color: rewardsPopupHeaderText }}
                    >
                      {customerAuthStatus === "signedIn"
                        ? `${rewardTier} member`
                        : "Join rewards"}
                    </h3>
                    <div className="mt-4">
                      <span
                        className="inline-flex rounded-full px-4 py-2 text-sm font-semibold ring-1"
                        style={{ backgroundColor: rewardsPopupPillBackground, color: rewardsPopupPillText, borderColor: rewardsPopupCardBorder }}
                      >
                        {customerAuthStatus === "signedIn"
                          ? `${rewardDiscount}% reward discount`
                          : "Automatic enrolment"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRewardsModalOpen(false)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-xl shadow-sm transition hover:-translate-y-[1px]"
                    style={{
                      backgroundColor: rewardsPopupCloseBackground,
                      borderColor: rewardsPopupFooterBorder,
                      color: rewardsPopupCloseText,
                    }}
                    aria-label="Close rewards"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-6 sm:px-6 sm:pb-11 sm:pt-7 lg:px-7 lg:pb-12 lg:pt-8 xl:px-8 xl:pb-14 xl:pt-8">
                <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr] xl:items-start xl:gap-7">
                  <div
                    className="rounded-[24px] border p-4 sm:p-5 lg:p-6"
                    style={{ backgroundColor: rewardsPopupCardBackground, borderColor: rewardsPopupCardBorder }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: rewardsPopupLabelText }}>
                      Reward status
                    </p>
                    <div className="mt-3 text-[15px] leading-7" style={{ color: rewardsPopupBodyText }}>
                      <p>
                        {customerAuthStatus === "signedIn"
                          ? `You currently receive ${rewardDiscount}% off eligible orders with this store.`
                          : "Create or sign in to your account and you’ll be automatically enrolled."}
                      </p>
                      {customerAuthStatus === "signedIn" && customerRewards ? (
                        <p className="mt-3">
                          {rewardNextTier
                            ? `Spend ${formatMoney(rewardSpendToNext, moneySettings)} more to reach ${rewardNextTier}.`
                            : "You have reached the top tier. Very civilised indeed."}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-4 xl:space-y-5">
                    {customerAuthStatus === "signedIn" && customerRewards ? (
                      <div
                        className="rounded-[24px] border p-4 shadow-sm sm:p-5 lg:p-6"
                        style={{ backgroundColor: rewardsPopupCardBackground, borderColor: rewardsPopupCardBorder, color: rewardsPopupBodyText }}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: rewardsPopupLabelText }}>
                          Qualifying spend
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-4 text-sm" style={{ color: rewardsPopupBodyText }}>
                          <span>Total qualifying spend</span>
                          <strong style={{ color: rewardsPopupHeaderText }}>
                            {formatMoney(
                              customerRewards.qualifyingSpend,
                              moneySettings,
                            )}
                          </strong>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ backgroundColor: rewardsPopupProgressBackground }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${rewardProgress}%`, backgroundColor: rewardsPopupProgressFill }}
                          />
                        </div>
                        <p className="mt-3 text-sm leading-6" style={{ color: rewardsPopupBodyText }}>
                          {rewardNextTier
                            ? `Spend ${formatMoney(rewardSpendToNext, moneySettings)} more to reach ${rewardNextTier}.`
                            : "You have reached the top tier. Very civilised indeed."}
                        </p>
                      </div>
                    ) : (
                      <div
                        className="rounded-[24px] border p-4 text-sm leading-6 shadow-sm sm:p-5 lg:p-6"
                        style={{ backgroundColor: rewardsPopupCardBackground, borderColor: rewardsPopupCardBorder, color: rewardsPopupBodyText }}
                      >
                        Sign in or create an account to track your spend, unlock
                        tier discounts, and keep favourites and buy-again items
                        handy.
                      </div>
                    )}
                    <div
                      className="rounded-[24px] border p-4 shadow-sm sm:p-5 lg:p-6"
                      style={{ backgroundColor: rewardsPopupCardBackground, borderColor: rewardsPopupCardBorder, color: rewardsPopupBodyText }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: rewardsPopupLabelText }}>
                        Reward tiers
                      </p>
                      <div className="mt-4 grid gap-3">
                        <RewardInfoRow
                          name="Silver"
                          spend="Automatic"
                          discount={Number(rewardsSilverDiscountPercent || 0)}
                        />
                        <RewardInfoRow
                          name="Gold"
                          spend={`${formatMoney(Number(rewardsGoldMinSpend || 1000), moneySettings)} spend`}
                          discount={Number(rewardsGoldDiscountPercent || 5)}
                        />
                        <RewardInfoRow
                          name="Platinum"
                          spend={`${formatMoney(Number(rewardsPlatinumMinSpend || 2500), moneySettings)} spend`}
                          discount={Number(
                            rewardsPlatinumDiscountPercent || 10,
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="sticky bottom-0 z-10 border-t px-4 py-4 sm:px-6 sm:py-5 lg:px-7 lg:py-6 xl:px-8"
                style={{ backgroundColor: rewardsPopupFooterBackground, borderColor: rewardsPopupFooterBorder }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <button
                    type="button"
                    onClick={() => setRewardsModalOpen(false)}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium transition hover:-translate-y-[1px] lg:px-7"
                    style={{
                      backgroundColor: rewardsPopupCloseBackground,
                      borderColor: rewardsPopupFooterBorder,
                      color: rewardsPopupCloseText,
                    }}
                  >
                    Back to menu
                  </button>
                  <a
                    href={
                      customerAuthStatus === "signedIn"
                        ? "/checkout"
                        : "/account/signup"
                    }
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border px-7 py-3 text-sm font-semibold transition hover:-translate-y-[1px] lg:px-8"
                    style={{
                      backgroundColor: rewardsPopupButtonBackground,
                      borderColor: rewardsPopupButtonBackground,
                      color: rewardsPopupButtonText,
                    }}
                  >
                    {customerAuthStatus === "signedIn"
                      ? "Go to checkout"
                      : "Create account"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {shouldRenderFavouritesArea ? (
        <section
          id="customer-favourites-section"
          className="relative min-h-[228px] overflow-hidden rounded-[26px] border px-3 py-4 shadow-[0_20px_56px_rgba(120,53,15,0.22)] ring-1 ring-white/35 sm:min-h-[242px] sm:px-4 sm:py-5 lg:min-h-[248px] lg:px-5"
          style={{
            backgroundColor: favouritesBackground,
            borderColor: favouritesBorder,
            color: favouritesText,
          }}
          aria-label="Favourite products"
        >
          <div className="pointer-events-none absolute -right-12 -top-16 h-[10.5rem] w-[10.5rem] rounded-full bg-amber-200/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-orange-300/18 blur-3xl" />
          <div className="relative z-10 mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.22em]"
                style={{ color: favouritesLabelText }}
              >
                Your favourites
              </p>
              <h2
                className="mt-1 text-xl font-black tracking-tight sm:text-2xl"
                style={{ color: favouritesText }}
              >
                {favouritesReady ? "Saved favourites" : "Loading favourites"}
              </h2>
            </div>
            {favouriteProducts.length > 1 ? (
              <p
                className="text-[10px] font-bold uppercase tracking-[0.15em] lg:hidden"
                style={{ color: favouritesText }}
              >
                Swipe sideways
              </p>
            ) : null}
          </div>

          {!favouritesReady ? (
            <div
              className="relative z-10 mx-auto flex max-w-full snap-x snap-mandatory gap-4 overflow-hidden px-[19vw] pb-1 pt-1 sm:px-[calc(50%_-_124px)] lg:px-[calc(50%_-_124px)]"
              aria-label="Loading favourite products"
            >
              <div className="flex w-[62vw] max-w-[248px] shrink-0 snap-center flex-col overflow-hidden rounded-[24px] border border-white/35 bg-white/18 p-3 ring-1 ring-white/20 sm:w-[248px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="h-6 w-24 rounded-full bg-white/24" />
                  <span className="h-8 w-8 rounded-xl bg-white/22" />
                </div>
                <div className="mt-4 aspect-[1.25/1] rounded-[20px] border border-white/20 bg-white/16" />
                <div className="mx-auto mt-4 h-4 w-32 rounded-full bg-white/24" />
                <div className="mx-auto mt-3 h-8 w-40 rounded-xl bg-white/18" />
              </div>
            </div>
          ) : null}

          {favouritesReady && favouritesMessage ? (
            <div className="relative z-10 rounded-2xl border border-white/20 bg-white/12 px-4 py-3 text-sm font-semibold text-white/90">
              {favouritesMessage}
            </div>
          ) : null}

          {favouritesReady && favouriteProducts.length ? (
            <div className="relative z-10">
              {favouriteProducts.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => scrollFavourites("left")}
                    className="absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/55 bg-white/92 text-amber-950 shadow-[0_16px_34px_rgba(15,23,42,0.22)] backdrop-blur transition hover:scale-[1.04] hover:bg-white lg:inline-flex"
                    aria-label="Previous favourite"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollFavourites("right")}
                    className="absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/55 bg-white/92 text-amber-950 shadow-[0_16px_34px_rgba(15,23,42,0.22)] backdrop-blur transition hover:scale-[1.04] hover:bg-white lg:inline-flex"
                    aria-label="Next favourite"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              ) : null}
              <div
                ref={favouritesStripRef}
                className="mx-auto flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[19vw] pb-1 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-[calc(50%_-_124px)] lg:px-[calc(50%_-_124px)]"
              >
                {favouriteProducts.map((product) => (
                  <FavouriteProductStripCard
                    key={product.id}
                    product={product}
                    moneySettings={moneySettings}
                    accentColor={brandAccent}
                    primaryColor={brandPrimary}
                    themeColors={storefrontTheme}
                    isBusy={Boolean(favouriteBusyById[product.id])}
                    onAddToCart={(productId, options) =>
                      void addToCart(productId, options)
                    }
                    onRemoveFavourite={(productId) =>
                      void toggleFavourite(productId)
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {shouldRenderBuyAgainArea ? (
        <section
          id="customer-buy-again-section"
          className="relative min-h-[228px] overflow-hidden rounded-[26px] border px-3 py-4 shadow-[0_20px_56px_rgba(120,53,15,0.22)] ring-1 ring-white/35 sm:min-h-[242px] sm:px-4 sm:py-5 lg:min-h-[248px] lg:px-5"
          style={{
            backgroundColor: favouritesBackground,
            borderColor: favouritesBorder,
            color: favouritesText,
          }}
          aria-label="Buy again products"
        >
          <div className="pointer-events-none absolute -right-12 -top-16 h-[10.5rem] w-[10.5rem] rounded-full bg-amber-200/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-orange-300/18 blur-3xl" />
          <div className="relative z-10 mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="text-[10px] font-black uppercase tracking-[0.22em]"
                style={{ color: favouritesLabelText }}
              >
                Buy again
              </p>
              <h2
                className="mt-1 text-xl font-black tracking-tight sm:text-2xl"
                style={{ color: favouritesText }}
              >
                {buyAgainReady
                  ? "Previously purchased"
                  : "Loading previous buys"}
              </h2>
            </div>
            {buyAgainProducts.length > 1 ? (
              <p
                className="text-[10px] font-bold uppercase tracking-[0.15em] lg:hidden"
                style={{ color: favouritesText }}
              >
                Swipe sideways
              </p>
            ) : null}
          </div>

          {!buyAgainReady ? (
            <div
              className="relative z-10 mx-auto flex max-w-full snap-x snap-mandatory gap-4 overflow-hidden px-[19vw] pb-1 pt-1 sm:px-[calc(50%_-_124px)] lg:px-[calc(50%_-_124px)]"
              aria-label="Loading buy again products"
            >
              <div className="flex w-[62vw] max-w-[248px] shrink-0 snap-center flex-col overflow-hidden rounded-[24px] border border-white/35 bg-white/18 p-3 ring-1 ring-white/20 sm:w-[248px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="h-6 w-24 rounded-full bg-white/24" />
                  <span className="h-8 w-8 rounded-xl bg-white/22" />
                </div>
                <div className="mt-4 aspect-[1.25/1] rounded-[20px] border border-white/20 bg-white/16" />
                <div className="mx-auto mt-4 h-4 w-32 rounded-full bg-white/24" />
                <div className="mx-auto mt-3 h-8 w-40 rounded-xl bg-white/18" />
              </div>
            </div>
          ) : null}

          {buyAgainReady && buyAgainMessage ? (
            <div className="relative z-10 rounded-2xl border border-white/20 bg-white/12 px-4 py-3 text-sm font-semibold text-white/90">
              {buyAgainMessage}
            </div>
          ) : null}

          {buyAgainReady && buyAgainProducts.length ? (
            <div className="relative z-10">
              {buyAgainProducts.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => scrollBuyAgain("left")}
                    className="absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/55 bg-white/92 text-amber-950 shadow-[0_16px_34px_rgba(15,23,42,0.22)] backdrop-blur transition hover:scale-[1.04] hover:bg-white lg:inline-flex"
                    aria-label="Previous buy again product"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollBuyAgain("right")}
                    className="absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/55 bg-white/92 text-amber-950 shadow-[0_16px_34px_rgba(15,23,42,0.22)] backdrop-blur transition hover:scale-[1.04] hover:bg-white lg:inline-flex"
                    aria-label="Next buy again product"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </>
              ) : null}
              <div
                ref={buyAgainStripRef}
                className="mx-auto flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[19vw] pb-1 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-[calc(50%_-_124px)] lg:px-[calc(50%_-_124px)]"
              >
                {buyAgainProducts.map((product) => (
                  <FavouriteProductStripCard
                    key={product.id}
                    product={product}
                    moneySettings={moneySettings}
                    accentColor={brandAccent}
                    primaryColor={brandPrimary}
                    themeColors={storefrontTheme}
                    stripKind="buyAgain"
                    isBusy={false}
                    onAddToCart={(productId, options) =>
                      void addToCart(productId, options)
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {customAmountPickerProduct ? (
        <div
          className="fixed inset-0 z-[125] px-[35px] py-[75px] backdrop-blur-[2px] overscroll-none"
          style={{ backgroundColor: "rgba(15,23,42,0.54)" }}
          role="dialog"
          aria-modal="true"
          onClick={() => setCustomAmountPickerProduct(null)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="flex max-h-[calc(100dvh-150px)] w-full max-w-[560px] flex-col overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.28)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 px-5 pb-5 pt-5 sm:px-7">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-700 via-slate-700 to-emerald-500" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Customer payment
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                      {customAmountPickerProduct.product.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {customAmountPickerProduct.product
                        .custom_amount_help_text ||
                        "Enter the amount shown on your invoice."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomAmountPickerProduct(null)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 shadow-sm"
                    aria-label="Close payment amount"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="modal-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-6 sm:px-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Your name *
                    </label>
                    <input
                      value={customAmountCustomerName}
                      onChange={(event) =>
                        setCustomAmountCustomerName(event.target.value)
                      }
                      placeholder="Full name"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Phone number *
                    </label>
                    <input
                      value={customAmountCustomerPhone}
                      onChange={(event) =>
                        setCustomAmountCustomerPhone(event.target.value)
                      }
                      placeholder="Phone number"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {customAmountPickerProduct.product
                      .custom_amount_reference_label || "Invoice number"}{" "}
                    *
                  </label>
                  <input
                    value={customAmountReference}
                    onChange={(event) =>
                      setCustomAmountReference(event.target.value)
                    }
                    placeholder="e.g. INV-1007"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {customAmountPickerProduct.product.custom_amount_label ||
                      "Amount to pay"}
                  </label>
                  <input
                    type="number"
                    min={Math.max(
                      0,
                      Number(
                        customAmountPickerProduct.product.custom_amount_min ??
                          1,
                      ),
                    )}
                    max={
                      customAmountPickerProduct.product.custom_amount_max ||
                      undefined
                    }
                    step="0.01"
                    value={customAmountValue}
                    onChange={(event) =>
                      setCustomAmountValue(event.target.value)
                    }
                    placeholder={formatMoney(
                      Math.max(
                        0,
                        Number(
                          customAmountPickerProduct.product.custom_amount_min ??
                            1,
                        ),
                      ),
                      moneySettings,
                    )}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Optional note
                  </label>
                  <textarea
                    value={customAmountNote}
                    onChange={(event) =>
                      setCustomAmountNote(event.target.value)
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                {customAmountError ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {customAmountError}
                  </p>
                ) : null}
              </div>
              <div className="sticky bottom-0 flex gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={() => setCustomAmountPickerProduct(null)}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={startStandaloneCustomerPayment}
                  disabled={customAmountSubmitting}
                  className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-70"
                >
                  {customAmountSubmitting
                    ? "Opening payment..."
                    : "Continue to secure payment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {variantPickerProduct ? (
        <div
          className="fixed inset-0 z-[120] px-[35px] py-[75px] backdrop-blur-[2px] overscroll-none"
          style={{ backgroundColor: "rgba(15,23,42,0.54)" }}
          role="dialog"
          aria-modal="true"
          onClick={() => setVariantPickerProduct(null)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="flex max-h-[calc(100dvh-150px)] w-full max-w-[720px] flex-col overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:rounded-[28px]"
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="sticky top-0 z-10 border-b px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-7"
                style={{
                  borderColor: brandBorder,
                  background: `linear-gradient(135deg, #ffffff 0%, ${brandSurface} 52%, ${blendHex(brandAccent, "#FFFFFF", 0.88)} 100%)`,
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{
                    background: `linear-gradient(90deg, ${brandAccent}, ${brandPrimary}, ${brandAccent})`,
                  }}
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {variantPickerProduct.product.variant_label ||
                        "Choose an option"}
                    </p>
                    <h3 className="mt-2 pr-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">
                      {variantPickerProduct.product.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Choose the standard product as shown, or select another
                      available option.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVariantPickerProduct(null)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-white/95 text-xl shadow-sm transition hover:bg-white"
                    style={{ borderColor: brandBorder, color: brandPrimary }}
                    aria-label="Close variants"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-6 sm:px-6 sm:pb-11 sm:pt-7 lg:px-7 lg:pb-12">
                <div className="space-y-3">
                  {(() => {
                    const baseStock = variantStockState(
                      variantPickerProduct.product,
                      null,
                    );
                    return (
                      <button
                        type="button"
                        disabled={baseStock.outOfStock}
                        onClick={() => {
                          if (baseStock.outOfStock) return;
                          const current = variantPickerProduct;
                          setVariantPickerProduct(null);
                          void addCartLine(
                            current.product.id,
                            null,
                            current.options,
                          );
                        }}
                        className="flex w-full items-center justify-between gap-4 rounded-[22px] border px-4 py-4 text-left shadow-sm transition enabled:hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          borderColor: brandAccent,
                          backgroundColor: blendHex(
                            brandAccent,
                            "#FFFFFF",
                            0.9,
                          ),
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-950">
                            Standard product
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            Add {variantPickerProduct.product.name} exactly as
                            shown on the menu.
                          </span>
                          {baseStock.outOfStock ? (
                            <span className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                              Sold out
                            </span>
                          ) : baseStock.lowStock ? (
                            <span className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                              Only {baseStock.available} left
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-950">
                          {formatMoney(
                            Number(variantPickerProduct.product.price || 0),
                            moneySettings,
                          )}
                        </span>
                      </button>
                    );
                  })()}
                  {activeProductVariants(variantPickerProduct.product).map(
                    (variant) => {
                      const variantPrice = getVariantPrice(
                        Number(variantPickerProduct.product.price || 0),
                        variant,
                      );
                      const stock = variantStockState(
                        variantPickerProduct.product,
                        variant,
                      );
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={stock.outOfStock}
                          onClick={() => {
                            if (stock.outOfStock) return;
                            const current = variantPickerProduct;
                            setVariantPickerProduct(null);
                            void addCartLine(
                              current.product.id,
                              variant,
                              current.options,
                            );
                          }}
                          className="flex w-full items-center justify-between gap-4 rounded-[22px] border bg-white px-4 py-4 text-left shadow-sm transition enabled:hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                          style={{
                            borderColor: stock.outOfStock
                              ? "#E2E8F0"
                              : brandBorder,
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-950">
                              {variant.name}
                            </span>
                            {variant.description ? (
                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                {variant.description}
                              </span>
                            ) : null}
                            {stock.outOfStock ? (
                              <span className="mt-2 inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                                Sold out
                              </span>
                            ) : stock.lowStock ? (
                              <span className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                Only {stock.available} left
                              </span>
                            ) : null}
                          </span>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-950">
                            {formatMoney(variantPrice, moneySettings)}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
              <div
                className="sticky bottom-0 z-10 border-t bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-7"
                style={{ borderColor: brandBorder }}
              >
                <button
                  type="button"
                  onClick={() => setVariantPickerProduct(null)}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border px-7 py-3 text-sm font-semibold transition hover:-translate-y-[1px]"
                  style={{
                    borderColor: brandAccent,
                    backgroundColor: blendHex(brandAccent, "#FFFFFF", 0.88),
                    color: brandPrimary,
                  }}
                >
                  Back to menu
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showInvoicePaymentsSection ? (
        <section className="mb-8 sm:mb-10">
          <div className="mb-4 flex flex-col gap-2 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                style={{ color: brandAccent }}
              >
                Customer payments
              </p>
              <h2
                className="mt-1 text-[1.38rem] font-semibold tracking-tight sm:text-[1.95rem]"
                style={{ color: brandText }}
              >
                {invoicePaymentsSectionTitle || "Payments"}
              </h2>
              <p
                className="mt-1 max-w-2xl text-sm leading-6"
                style={{ color: brandSoftText }}
              >
                {invoicePaymentsIntroText ||
                  "Pay an invoice, deposit or statement balance securely online."}
              </p>
            </div>
            <span
              className="w-fit rounded-full border bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] shadow-sm sm:px-3.5 sm:text-[11px] sm:tracking-[0.18em]"
              style={{ borderColor: brandBorder, color: brandSoftText }}
            >
              {invoicePaymentOptions.length} payment{" "}
              {invoicePaymentOptions.length === 1 ? "option" : "options"}
            </span>
          </div>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {invoicePaymentOptions.map((option) => (
              <InvoicePaymentCard
                key={option.id}
                option={option}
                moneySettings={moneySettings}
                brandPrimary={brandPrimary}
                brandAccent={brandAccent}
                brandBorder={brandBorder}
                onPay={openStandalonePayment}
              />
            ))}
          </div>
        </section>
      ) : null}

      {categories.map((category) => {
        const categoryProducts = normalStorefrontProducts.filter(
          (product) =>
            product.category_id === category.id ||
            product.secondary_category_id === category.id,
        );
        if (!categoryProducts.length) return null;

        return (
          <section key={category.id} className="mb-8 sm:mb-10">
            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
              <h2
                className="text-[1.38rem] font-semibold tracking-tight sm:text-[1.95rem]"
                style={{ color: brandText }}
              >
                {category.name}
              </h2>
              <span
                className="rounded-full border bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] shadow-sm sm:px-3.5 sm:text-[11px] sm:tracking-[0.18em]"
                style={{ borderColor: brandBorder, color: brandSoftText }}
              >
                {categoryProducts.length}{" "}
                {categoryProducts.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {categoryProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  description={product.description}
                  imageUrl={product.image_url}
                  price={Number(product.price)}
                  tenantSlug={tenantSlug}
                  stockEnabled={product.stock_enabled}
                  stockQuantity={product.stock_quantity}
                  lowStockThreshold={product.low_stock_threshold}
                  variantsEnabled={product.variants_enabled}
                  variantLabel={product.variant_label}
                  productVariants={product.product_variants}
                  productType={product.product_type}
                  customAmountEnabled={product.custom_amount_enabled}
                  customAmountLabel={product.custom_amount_label}
                  customAmountReferenceLabel={
                    product.custom_amount_reference_label
                  }
                  customAmountReferenceRequired={
                    product.custom_amount_reference_required
                  }
                  customAmountMin={product.custom_amount_min}
                  customAmountMax={product.custom_amount_max}
                  customAmountHelpText={product.custom_amount_help_text}
                  customAmountDisableRewards={
                    product.custom_amount_disable_rewards
                  }
                  customAmountDisableDiscounts={
                    product.custom_amount_disable_discounts
                  }
                  moneySettings={moneySettings}
                  accentColor={accentColor}
                  primaryColor={primaryColor}
                  themeColors={storefrontTheme}
                  isFavourite={favouriteIdSet.has(product.id)}
                  favouriteBusy={Boolean(favouriteBusyById[product.id])}
                  onToggleFavourite={(productId) =>
                    void toggleFavourite(productId)
                  }
                  onAddToCartAnimation={(payload) =>
                    launchAddToCartAnimation({
                      ...payload,
                      destination: "header",
                    })
                  }
                  initiallyOpen={initialProductId === product.id}
                />
              ))}
            </div>
          </section>
        );
      })}

      {footerIconLinks.length ? (
        <section
          className="rounded-[28px] border px-5 py-5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 sm:px-6 sm:py-6 lg:px-8 lg:py-7"
          style={{
            backgroundColor: footerBackground,
            borderColor: brandBorder,
            color: footerText,
          }}
        >
          <div
            className="mx-auto flex w-full max-w-[244px] flex-wrap items-center justify-center gap-3 sm:max-w-[256px]"
            aria-label="Store footer links"
          >
            {footerIconLinks.map((link) => (
              <FooterIcon
                key={link.label}
                label={link.label}
                href={link.href || null}
              >
                {link.icon}
              </FooterIcon>
            ))}
          </div>
        </section>
      ) : null}

      <footer
        className="rounded-[24px] border px-5 py-5 text-center text-sm shadow-sm sm:px-6"
        style={{
          backgroundColor: footerBackground,
          borderColor: brandBorder,
          color: footerText,
        }}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          {showOrduvaReferralAd !== false ? (
            <div className="w-full overflow-hidden rounded-[24px] border border-[#FF6A3D]/20 bg-[linear-gradient(135deg,#FFF7F0_0%,#FFFFFF_52%,#FFE7D9_100%)] p-4 text-left shadow-[0_18px_45px_rgba(14,14,16,0.08)] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C84F2A]">
                    Powered by Orduva
                  </p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#0E0E10]">
                    Do you need a store like this?
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5C5F66]">
                    Launch your own branded ordering storefront with products,
                    customer accounts and simple order management.
                  </p>
                  <a
                    href={affiliateApplicationHref}
                    onClick={() => {
                      if (typeof window !== "undefined")
                        window.dispatchEvent(
                          new CustomEvent("orduva:analytics", {
                            detail: {
                              eventType: "affiliate_apply_click",
                              scope: "tenant_storefront",
                              tenantId,
                              tenantSlug,
                              metadata: { source: "storefront_footer" },
                            },
                          }),
                        );
                    }}
                    className="mt-3 inline-flex text-xs font-black uppercase tracking-[0.18em] text-[#0E6F5C] underline decoration-[#0E6F5C]/30 underline-offset-4 transition hover:text-[#084C41]"
                  >
                    Apply to become an Orduva affiliate
                  </a>
                </div>
                <a
                  href={referralSignupHref}
                  onClick={() => {
                    if (typeof window !== "undefined")
                      window.dispatchEvent(
                        new CustomEvent("orduva:analytics", {
                          detail: {
                            eventType: "referral_link_click",
                            scope: "tenant_storefront",
                            tenantId,
                            tenantSlug,
                            metadata: { source: "storefront_footer" },
                          },
                        }),
                      );
                  }}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:-translate-y-[1px] hover:bg-[#E95B30]"
                >
                  See how Orduva works
                </a>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span
              className="inline-flex rounded-[4px] px-1.5 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.20em] text-white"
              style={{ backgroundColor: footerBadgeBackground }}
            >
              Orduva Online
            </span>
            <span className="inline-flex rounded-[4px] border border-slate-200 bg-white px-1.5 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {version.replace("Ver: ", "V ")}
            </span>
          </div>
          <a
            href="/admin/login"
            className="inline-flex min-h-[38px] items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-2 text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            title="Store admin login"
          >
            Admin Login
          </a>
        </div>
      </footer>

      {favouriteLoginPromptOpen ? (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/62 px-[35px] py-[75px] backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="favourite-login-title"
          onClick={() => setFavouriteLoginPromptOpen(false)}
        >
          <div className="flex min-h-full w-full items-center justify-center">
            <div
              className="relative mx-auto flex max-h-[calc(100dvh-150px)] w-full max-w-[430px] flex-col overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_34px_100px_rgba(15,23,42,0.30)] ring-1 ring-slate-900/5"
              onClick={(event) => event.stopPropagation()}
            >
              <div
                className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: brandAccent }}
              />
              <div
                className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full opacity-15 blur-3xl"
                style={{ backgroundColor: brandPrimary }}
              />
              <div className="modal-scroll relative min-h-0 overflow-y-auto px-5 pb-8 pt-6 sm:px-6 sm:pb-9 sm:pt-7">
                <button
                  type="button"
                  onClick={() => setFavouriteLoginPromptOpen(false)}
                  className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
                  aria-label="Close favourites login prompt"
                >
                  ×
                </button>

                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] border border-white bg-white text-3xl shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
                  style={{ color: brandAccent }}
                  aria-hidden="true"
                >
                  ♥
                </div>

                <div className="mt-5 text-center">
                  <p
                    className="text-[10px] font-black uppercase tracking-[0.22em]"
                    style={{ color: brandAccent }}
                  >
                    Save your favourites
                  </p>
                  <h2
                    id="favourite-login-title"
                    className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-[1.65rem]"
                  >
                    Login or create an account first
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Favourites are saved to your customer account so they are
                    ready the next time you open this store. Login, or set up an
                    account, then tap the heart again.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a
                    href="/account/login"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-[17px] border px-4 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)] transition hover:-translate-y-[1px]"
                    style={{
                      backgroundColor: brandPrimary,
                      borderColor: brandPrimary,
                    }}
                  >
                    Login
                  </a>
                  <a
                    href="/account/signup"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-[17px] border bg-white px-4 py-3 text-sm font-black shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-[1px]"
                    style={{ borderColor: brandAccent, color: brandPrimary }}
                  >
                    Create account
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() => setFavouriteLoginPromptOpen(false)}
                  className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center rounded-[15px] border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {searchOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 px-[35px] py-[75px] backdrop-blur-[2px] overscroll-none"
          onClick={() => setSearchOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="flex max-h-[calc(100dvh-150px)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:rounded-[28px]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/50 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-8 lg:pb-7 lg:pt-6">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Search menu
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">
                      Find something quickly
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Search by product name, keyword, or narrow the results to
                      a category.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      ref={searchCartIndicatorRef}
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(
                            new CustomEvent("orduva:analytics", {
                              detail: {
                                eventType: "checkout_started",
                                scope: "tenant_storefront",
                                tenantId,
                                tenantSlug,
                                metadata: {
                                  source: "search_popup_cart_button",
                                },
                              },
                            }),
                          );
                          window.location.assign("/checkout");
                        }
                      }}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-50 hover:text-slate-950"
                      aria-label={`Go to checkout with ${cartCount} item${cartCount === 1 ? "" : "s"}`}
                      title="Go to checkout"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="9" cy="20" r="1" />
                        <circle cx="18" cy="20" r="1" />
                        <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H7" />
                      </svg>
                      <span>{cartCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
                      aria-label="Close search"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="block">
                    <span className="sr-only">Search products</span>
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search menu items"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">Filter by category</span>
                    <select
                      value={activeCategoryId}
                      onChange={(event) =>
                        setActiveCategoryId(event.target.value)
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    >
                      <option value="all">All categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10 pt-6 sm:px-6 sm:pb-11 sm:pt-7 lg:px-7 lg:pb-12 lg:pt-8 xl:px-8 xl:pb-14 xl:pt-8">
                <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <p>
                    {filteredProducts.length}{" "}
                    {filteredProducts.length === 1 ? "result" : "results"}
                  </p>
                  {query.trim() || activeCategoryId !== "all" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setActiveCategoryId("all");
                      }}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Clear search
                    </button>
                  ) : null}
                </div>

                {filteredProducts.length ? (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => {
                      const categoryName =
                        categories.find(
                          (category) => category.id === product.category_id,
                        )?.name || "Menu item";
                      const state = buttonStateById[product.id] || "idle";
                      const thumbId = `search-thumb-${product.id}`;
                      const searchTrackedStock = !!product.stock_enabled;
                      const searchAvailableStock = Math.max(
                        0,
                        Number(product.stock_quantity || 0),
                      );
                      const searchLowStockThreshold = Math.max(
                        0,
                        Number(product.low_stock_threshold || 5),
                      );
                      const searchOutOfStock =
                        searchTrackedStock && searchAvailableStock <= 0;
                      const searchLowStock =
                        searchTrackedStock &&
                        searchAvailableStock > 0 &&
                        searchAvailableStock <= searchLowStockThreshold;
                      return (
                        <div
                          key={product.id}
                          className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5"
                        >
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div
                              id={thumbId}
                              className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
                            >
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] font-medium text-slate-500">
                                  No image
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 flex-col items-center text-center">
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                <h4 className="text-lg font-semibold text-slate-900">
                                  {product.name}
                                </h4>
                                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-500 ring-1 ring-slate-200">
                                  {categoryName}
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {stripHtml(product.description).slice(0, 140) ||
                                  "Freshly prepared and ready to order."}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {formatMoney(
                                      Number(product.price),
                                      moneySettings,
                                    )}
                                  </p>
                                  {state === "added" ? (
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                      In cart: {cartCount}
                                    </span>
                                  ) : null}
                                  {searchTrackedStock &&
                                  (searchOutOfStock || searchLowStock) ? (
                                    <span
                                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${searchOutOfStock ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-orange-50 text-orange-700 ring-1 ring-orange-100"}`}
                                    >
                                      {searchOutOfStock
                                        ? "Out of stock"
                                        : `Only ${searchAvailableStock} left`}
                                    </span>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sourceRect =
                                      document
                                        .getElementById(thumbId)
                                        ?.getBoundingClientRect() || null;
                                    void addToCart(product.id, {
                                      sourceRect,
                                      imageUrl: product.image_url,
                                      name: product.name,
                                      destination: "search",
                                    });
                                  }}
                                  disabled={searchOutOfStock}
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {searchOutOfStock
                                    ? "Sold out"
                                    : state === "adding"
                                      ? "Adding..."
                                      : state === "added"
                                        ? "Added ✓"
                                        : "Add"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-[26px] border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
                    <p className="text-lg font-semibold text-slate-900">
                      No matching products
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Try another search term or switch the category filter.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
