"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import CartButton from "@/components/menu/CartButton";
import CustomerAccountHeaderActions from "@/components/account/CustomerAccountHeaderActions";
import ProductCard from "@/components/menu/ProductCard";
import { StoredCartItem, readCart, subscribeToCartUpdates, writeCart } from "@/lib/cart";
import { buildMoneySettings, formatMoney, type MoneyFormatSettings } from "@/lib/money";
import { normalizeThemeColor, type StorefrontTheme } from "@/lib/storefront-theme";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  stock_enabled?: boolean | null;
  stock_quantity?: number | null;
  low_stock_threshold?: number | null;
};


type FavouriteProductStripCardProps = {
  product: Product;
  moneySettings: MoneyFormatSettings;
  accentColor: string;
  primaryColor: string;
  isBusy: boolean;
  themeColors?: StorefrontTheme | null;
  stripKind?: "favourite" | "buyAgain";
  onAddToCart: (productId: string, options?: { sourceRect?: DOMRect | null; imageUrl?: string | null; name?: string }) => void;
  onRemoveFavourite?: (productId: string) => void;
};

function FavouriteProductStripCard({ product, moneySettings, accentColor, primaryColor, isBusy, themeColors, stripKind = "favourite", onAddToCart, onRemoveFavourite }: FavouriteProductStripCardProps) {
  const imageFrameRef = useRef<HTMLDivElement | null>(null);
  const money = buildMoneySettings(moneySettings);
  const favouriteCardBackground = normalizeThemeColor(themeColors?.favouritesCardBackground, "#FFFFFF");
  const favouriteCardBorder = normalizeThemeColor(themeColors?.favouritesCardBorder, "#FCD34D");
  const favouriteCardShadow = normalizeThemeColor(themeColors?.favouritesCardShadow, accentColor);
  const favouriteCardShadowEnabled = themeColors?.favouritesCardShadowEnabled !== false;
  const favouriteCardTitle = normalizeThemeColor(themeColors?.favouritesCardTitle, "#0F172A");
  const favouritePriceBackground = normalizeThemeColor(themeColors?.favouritesPriceBackground, "#FFFFFF");
  const favouritePriceBorder = normalizeThemeColor(themeColors?.favouritesPriceBorder, accentColor);
  const favouritePriceText = normalizeThemeColor(themeColors?.favouritesPriceText, primaryColor);
  const favouriteAddBackground = normalizeThemeColor(themeColors?.favouritesAddBackground, primaryColor);
  const favouriteAddBorder = normalizeThemeColor(themeColors?.favouritesAddBorder, accentColor);
  const favouriteAddText = normalizeThemeColor(themeColors?.favouritesAddText, "#FFFFFF");
  const favouriteRemoveBackground = normalizeThemeColor(themeColors?.favouritesRemoveBackground, "#FFFFFF");
  const favouriteRemoveText = normalizeThemeColor(themeColors?.favouritesRemoveText, accentColor);
  const favouriteSwipeText = normalizeThemeColor(themeColors?.favouritesSwipeText, accentColor);
  const stripIsBuyAgain = stripKind === "buyAgain";
  const stripPillIcon = stripIsBuyAgain ? "↻" : "♥";
  const stripPillLabel = stripIsBuyAgain ? "Buy again" : "Favourite";
  const stripSwipeLabel = stripIsBuyAgain ? "Swipe to view previous buys" : "Swipe to view all favourites";
  const trackedStock = !!product.stock_enabled;
  const availableStock = Math.max(0, Number(product.stock_quantity || 0));
  const lowStockThreshold = Math.max(0, Number(product.low_stock_threshold || 5));
  const isOutOfStock = trackedStock && availableStock <= 0;
  const isLowStock = trackedStock && availableStock > 0 && availableStock <= lowStockThreshold;
  const stockRibbonLabel = isOutOfStock ? "Out of stock" : isLowStock ? `Only ${availableStock} left` : null;

  return (
    <article className="relative flex w-[62vw] max-w-[248px] shrink-0 snap-center flex-col overflow-hidden rounded-[24px] border p-3 ring-1 ring-white/80 sm:w-[248px]" style={{ backgroundColor: favouriteCardBackground, borderColor: favouriteCardBorder, boxShadow: favouriteCardShadowEnabled ? `0 8px 18px ${favouriteCardShadow}14` : "none" }}>
      <div className="pointer-events-none absolute -right-11 -top-11 h-24 w-24 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full bg-rose-300/8 blur-3xl" />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-white/85 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] shadow-sm" style={{ borderColor: favouritePriceBorder, color: favouriteSwipeText }}>
          <span aria-hidden="true">{stripPillIcon}</span>
          {stripPillLabel}
        </span>
        {onRemoveFavourite ? (
          <button
            type="button"
            onClick={() => onRemoveFavourite(product.id)}
            disabled={isBusy}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/80 shadow-[0_8px_18px_rgba(120,53,15,0.12)] transition hover:-translate-y-[1px] disabled:cursor-wait disabled:opacity-70"
            style={{ backgroundColor: favouriteRemoveBackground, color: favouriteRemoveText }}
            aria-label={`Remove ${product.name} from favourites`}
            title="Remove favourite"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" /></svg>
          </button>
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/70 bg-white/80 text-base font-black shadow-[0_8px_18px_rgba(120,53,15,0.10)]" style={{ color: favouriteSwipeText }} aria-hidden="true">↻</span>
        )}
      </div>

      <div className="relative z-10 mx-auto mt-4 w-full overflow-visible pt-3">
        {stockRibbonLabel ? (
          <div
            className="pointer-events-none absolute left-[10px] top-[20px] z-20 inline-flex max-w-[102px] -rotate-[16deg] items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-[5px] text-center text-[7.5px] font-semibold uppercase tracking-[0.07em] shadow-[0_10px_22px_rgba(15,23,42,0.14)] backdrop-blur-[2px] sm:left-[11px] sm:top-[21px]"
            style={isOutOfStock ? { backgroundColor: "rgba(255,255,255,0.94)", borderColor: "#FECACA", color: "#B91C1C" } : { backgroundColor: "rgba(255,255,255,0.94)", borderColor: "#FED7AA", color: "#C2410C" }}
          >
            {stockRibbonLabel}
          </div>
        ) : null}
        <div ref={imageFrameRef} className="aspect-[1.25/1] w-full overflow-hidden rounded-[20px] border border-white/80 shadow-[0_13px_30px_rgba(15,23,42,0.10)]" style={{ backgroundColor: favouritePriceBackground }}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-3" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 via-white to-slate-100 text-3xl">📦</div>
          )}
        </div>
      </div>

      <div className="relative z-10 mt-3 flex flex-1 flex-col text-center">
        <h3 className="mx-auto line-clamp-2 text-[0.94rem] font-semibold leading-tight tracking-tight" style={{ color: favouriteCardTitle }}>{product.name}</h3>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-sm" style={{ backgroundColor: favouritePriceBackground, borderColor: favouritePriceBorder, color: favouritePriceText }}>{formatMoney(Number(product.price), money)}</span>
          <button
            type="button"
            onClick={() => onAddToCart(product.id, { sourceRect: imageFrameRef.current?.getBoundingClientRect() || null, imageUrl: product.image_url, name: product.name })}
            disabled={isOutOfStock}
            className="inline-flex min-h-[34px] items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-black shadow-[0_11px_22px_rgba(15,23,42,0.16)] transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-65"
            style={{ backgroundColor: favouriteAddBackground, borderColor: favouriteAddBorder, color: favouriteAddText }}
          >
            {isOutOfStock ? "Sold out" : "Add"}
          </button>
        </div>
        <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: favouriteSwipeText }}>{stripSwipeLabel}</p>
      </div>
    </article>
  );
}

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
  return String(value || "").replace(/[^+\d]/g, "").replace(/(?!^)\+/g, "");
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

function FooterIcon({ label, href, children }: { label: string; href: string | null; children: ReactNode }) {
  if (!href) return null;
  return (
    <a href={href} className={iconLinkClass()} aria-label={label} title={label} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
      <span className="sr-only">{label}</span>
      {children}
    </a>
  );
}

function PhoneIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.1 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L9 10.69a16 16 0 0 0 4.31 4.31l1.25-1.25a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92z" /></svg>;
}
function WhatsAppIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="currentColor"><path d="M12.04 2a9.86 9.86 0 0 0-8.5 14.86L2.5 22l5.29-1a9.9 9.9 0 1 0 4.25-19Zm0 17.9a8.02 8.02 0 0 1-4.08-1.12l-.29-.17-3.14.6.61-3.05-.19-.31a7.98 7.98 0 1 1 7.09 4.05Zm4.39-5.99c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" /></svg>;
}
function EmailIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
}
function FacebookIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="currentColor"><path d="M14.2 8.4V6.7c0-.8.5-1 1-1h1.6V3.1A21.6 21.6 0 0 0 14.4 3c-2.4 0-4 1.5-4 4.1v1.3H7.7v3h2.7V21h3.3v-9.6h2.7l.4-3h-3.1Z" /></svg>;
}
function InstagramIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.25" /><circle cx="17.3" cy="6.7" r=".65" fill="currentColor" stroke="none" /></svg>;
}
function TikTokIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="currentColor"><path d="M14.6 3h2.8c.2 1.3.8 2.4 1.7 3.2.8.8 1.8 1.3 3 1.5v2.9a8.4 8.4 0 0 1-4.6-1.5v5.9c0 3.5-2.5 6-5.9 6A5.6 5.6 0 0 1 6 15.4c0-3.3 2.5-5.7 5.7-5.7.4 0 .8 0 1.1.1v3a3.5 3.5 0 0 0-1.1-.2 2.7 2.7 0 1 0 2.8 2.7V3Z" /></svg>;
}
function XIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="currentColor"><path d="M13.8 10.5 21 3h-1.7l-6.2 6.4L8.1 3H2.4l7.6 9.8L2.4 21h1.7l6.6-7 5.3 7h5.7l-7.9-10.5Zm-2.4 2.4-.8-1L4.5 4.3h2.8l4.9 6.1.8 1 6.4 8.2h-2.8l-5.2-6.7Z" /></svg>;
}
function WebsiteIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a13.7 13.7 0 0 1 0 18" /><path d="M12 3a13.7 13.7 0 0 0 0 18" /></svg>;
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
  trialState?: { checkoutBlocked?: boolean; isTrialExpired?: boolean; customerMessage?: string | null } | null;
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
  const searchCartIndicatorRef = useRef<HTMLDivElement | null>(null);
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
  const [buttonStateById, setButtonStateById] = useState<Record<string, "idle" | "adding" | "added">>({});
  const [cartCount, setCartCount] = useState(0);
  const [cartPulseKey, setCartPulseKey] = useState(0);
  const [flyingItems, setFlyingItems] = useState<FlyingCartItem[]>([]);
  const [welcomeCustomerName, setWelcomeCustomerName] = useState<string | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [favouritesReady, setFavouritesReady] = useState(false);
  const [favouritesSignedIn, setFavouritesSignedIn] = useState(false);
  const [customerAuthStatus, setCustomerAuthStatus] = useState<"checking" | "signedIn" | "signedOut">("checking");
  const [favouriteBusyById, setFavouriteBusyById] = useState<Record<string, boolean>>({});
  const [favouritesMessage, setFavouritesMessage] = useState<string | null>(null);
  const [favouriteLoginPromptOpen, setFavouriteLoginPromptOpen] = useState(false);
  const [favouritesVisible, setFavouritesVisible] = useState(false);
  const [buyAgainIds, setBuyAgainIds] = useState<string[]>([]);
  const [buyAgainReady, setBuyAgainReady] = useState(false);
  const [buyAgainVisible, setBuyAgainVisible] = useState(false);
  const [buyAgainMessage, setBuyAgainMessage] = useState<string | null>(null);

  const brandPrimary = primaryColor || "#7B1E22";
  const brandAccent = accentColor || "#C7922F";
  const brandSurface = normalizeThemeColor(storefrontTheme?.globalPageBackground || backgroundTint, "#F8F4F0");
  const brandBorder = normalizeThemeColor(storefrontTheme?.globalBorder || borderColor, "#D9C7A3");
  const brandText = normalizeThemeColor(storefrontTheme?.globalText || textColor, "#2B2B2B");
  const brandSoftText = normalizeThemeColor(storefrontTheme?.globalSoftText, brandText);
  const headerBackground = normalizeThemeColor(storefrontTheme?.headerBackground, brandSurface);
  const headerText = normalizeThemeColor(storefrontTheme?.headerText, brandText);
  const headerButtonBorder = normalizeThemeColor(storefrontTheme?.headerButtonBorder, brandAccent);
  const welcomeBackground = normalizeThemeColor(storefrontTheme?.welcomeBackground, "#FFFFFF");
  const welcomeLabel = normalizeThemeColor(storefrontTheme?.welcomeLabel, brandAccent);
  const welcomeHeadingColor = normalizeThemeColor(storefrontTheme?.welcomeHeading, brandPrimary);
  const welcomeBody = normalizeThemeColor(storefrontTheme?.welcomeBody, brandText);
  const welcomeBorder = normalizeThemeColor(storefrontTheme?.welcomeBorder, brandBorder);
  const welcomeShadow = normalizeThemeColor(storefrontTheme?.welcomeShadow, brandAccent);
  const footerBackground = normalizeThemeColor(storefrontTheme?.footerBackground, "#FFFFFF");
  const footerText = normalizeThemeColor(storefrontTheme?.footerText, brandText);
  const footerBadgeBackground = normalizeThemeColor(storefrontTheme?.footerBadgeBackground, brandAccent);
  const favouritesBackground = normalizeThemeColor(storefrontTheme?.favouritesBackground, "#451A03");
  const favouritesBorder = normalizeThemeColor(storefrontTheme?.favouritesBorder, brandAccent);
  const favouritesText = normalizeThemeColor(storefrontTheme?.favouritesText, "#FFFFFF");
  const favouritesLabelText = normalizeThemeColor(storefrontTheme?.favouritesLabelText, "#FDE68A");
  const brandAccentBorder = welcomeBorder;
  const phoneHref = cleanDialString(contactPhone) ? `tel:${cleanDialString(contactPhone)}` : null;
  const whatsAppHref = cleanWhatsAppNumber(contactWhatsApp || contactPhone) ? `https://wa.me/${cleanWhatsAppNumber(contactWhatsApp || contactPhone)}` : null;
  const emailHref = contactEmail?.trim() ? `mailto:${contactEmail.trim()}` : null;
  const footerIconLinks = [
    { label: "Call store", href: phoneHref, icon: <PhoneIcon /> },
    { label: "WhatsApp store", href: whatsAppHref, icon: <WhatsAppIcon /> },
    { label: "Email store", href: emailHref, icon: <EmailIcon /> },
    { label: "Facebook", href: normaliseExternalUrl(socialFacebookUrl), icon: <FacebookIcon /> },
    { label: "Instagram", href: normaliseExternalUrl(socialInstagramUrl), icon: <InstagramIcon /> },
    { label: "TikTok", href: normaliseExternalUrl(socialTikTokUrl), icon: <TikTokIcon /> },
    { label: "X", href: normaliseExternalUrl(socialXUrl), icon: <XIcon /> },
    { label: "Website", href: normaliseExternalUrl(socialWebsiteUrl), icon: <WebsiteIcon /> },
  ].filter((item) => Boolean(item.href)).slice(0, 8);
  const referralSignupHref = `https://www.orduva.com/start-your-store?ref_tenant=${encodeURIComponent(tenantSlug)}&ref=${encodeURIComponent(`tenant_${tenantSlug}`)}&ref_source=storefront_footer`;

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);

    async function loadCustomerWelcomeName() {
      try {
        const res = await fetch("/api/customer/auth/me", { cache: "no-store", signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && data?.customer) {
          const fullName = String(data.customer.fullName || "").trim();
          const email = String(data.customer.email || "").trim();
          const firstName = fullName.split(/\s+/).filter(Boolean)[0] || email.split("@")[0] || null;
          setWelcomeCustomerName(firstName);
          setCustomerAuthStatus("signedIn");
          setFavouritesSignedIn(true);
        } else if (!cancelled) {
          setWelcomeCustomerName(null);
          setCustomerAuthStatus("signedOut");
          setFavouritesSignedIn(false);
          setFavouriteIds([]);
          setFavouritesMessage(null);
          setBuyAgainIds([]);
          setBuyAgainMessage(null);
        }
      } catch {
        if (!cancelled) {
          setWelcomeCustomerName(null);
          setCustomerAuthStatus("signedOut");
          setFavouritesSignedIn(false);
          setFavouriteIds([]);
          setFavouritesMessage(null);
          setBuyAgainIds([]);
          setBuyAgainMessage(null);
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadCustomerWelcomeName();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

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
        const res = await fetch("/api/customer/favourites", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && Array.isArray(data?.productIds)) {
          setFavouriteIds(data.productIds.map((id: unknown) => String(id)).filter(Boolean));
          setFavouritesSignedIn(true);
          setFavouritesMessage(null);
        } else if (res.status === 401) {
          setFavouriteIds([]);
          setFavouritesSignedIn(false);
          setCustomerAuthStatus("signedOut");
          setFavouritesMessage(null);
        } else {
          setFavouritesMessage(String(data?.error || "Favourites could not be loaded."));
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
        const res = await fetch("/api/customer/buy-again", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && Array.isArray(data?.productIds)) {
          setBuyAgainIds(data.productIds.map((id: unknown) => String(id)).filter(Boolean));
          setBuyAgainMessage(null);
        } else if (res.status === 401) {
          setBuyAgainIds([]);
          setCustomerAuthStatus("signedOut");
          setBuyAgainMessage(null);
        } else {
          setBuyAgainMessage(String(data?.error || "Previous purchases could not be loaded."));
        }
      } catch {
        if (!cancelled) setBuyAgainMessage("Previous purchases could not be loaded.");
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
  const showFavouriteLoadingNote = customerAuthStatus === "signedIn" && !favouritesReady;
  const canToggleFavourites = customerAuthStatus === "signedIn" && favouritesReady && favouriteProducts.length > 0;
  const canToggleBuyAgain = customerAuthStatus === "signedIn" && buyAgainReady && buyAgainProducts.length > 0;
  const showNoFavouritesNote = customerAuthStatus === "signedIn" && favouritesReady && !favouritesMessage && favouriteProducts.length === 0;
  const shouldRenderFavouritesArea = customerAuthStatus === "signedIn" && favouritesVisible;
  const shouldRenderBuyAgainArea = customerAuthStatus === "signedIn" && buyAgainVisible;

  const favouriteIdSet = useMemo(() => new Set(favouriteIds), [favouriteIds]);

  function scrollProductStrip(stripRef: { current: HTMLDivElement | null }, direction: "left" | "right") {
    const strip = stripRef.current;
    if (!strip) return;
    const firstCard = strip.querySelector("article");
    const cardWidth = firstCard instanceof HTMLElement ? firstCard.offsetWidth : 248;
    strip.scrollBy({ left: direction === "left" ? -(cardWidth + 16) : cardWidth + 16, behavior: "smooth" });
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
    setFavouriteIds((current) => isFavourite ? current.filter((id) => id !== productId) : [productId, ...current.filter((id) => id !== productId)]);

    try {
      const res = await fetch(isFavourite ? `/api/customer/favourites?productId=${encodeURIComponent(productId)}` : "/api/customer/favourites", {
        method: isFavourite ? "DELETE" : "POST",
        headers: isFavourite ? undefined : { "Content-Type": "application/json" },
        body: isFavourite ? undefined : JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFavouriteIds(previousIds);
        if (res.status === 401) setFavouritesSignedIn(false);
        const detail = [data?.error, data?.details, data?.code ? `Code: ${data.code}` : null].filter(Boolean).join(" · ");
        setFavouritesMessage(String(detail || "Favourite could not be updated."));
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
    return products.filter((product) => {
      const categoryName = categories.find((category) => category.id === product.category_id)?.name || "";
      const matchesCategory = activeCategoryId === "all" || product.category_id === activeCategoryId;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;
      const haystack = [product.name, stripHtml(product.description), categoryName].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [products, categories, query, activeCategoryId]);

  useEffect(() => {
    const getCount = (items: StoredCartItem[]) => items.reduce((total, item) => total + Math.max(0, item.quantity || 0), 0);
    const update = (items: StoredCartItem[]) => setCartCount(getCount(items));

    update(readCart<StoredCartItem>(tenantSlug));
    return subscribeToCartUpdates<StoredCartItem>(tenantSlug, update);
  }, [tenantSlug]);

  useEffect(() => {
    if (!searchOpen) return;

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
  }, [searchOpen]);

  const triggerCartPulse = useCallback(() => {
    setCartPulseKey((current) => current + 1);
  }, []);

  const launchAddToCartAnimation = useCallback(
    ({ imageUrl, name, sourceRect, destination = "header" }: { imageUrl: string | null; name: string; sourceRect: DOMRect | null; destination?: "header" | "search" }) => {
      const targetElement = destination === "search" && searchCartIndicatorRef.current ? searchCartIndicatorRef.current : cartButtonRef.current;
      if (!sourceRect || !targetElement) {
        triggerCartPulse();
        return;
      }

      const targetRect = targetElement.getBoundingClientRect();
      const id = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const nextItem: FlyingCartItem = {
        id,
        name,
        imageUrl,
        startLeft: sourceRect.left,
        startTop: sourceRect.top,
        startWidth: sourceRect.width,
        startHeight: sourceRect.height,
        endCenterX: targetRect.left + targetRect.width / 2,
        endCenterY: targetRect.top + targetRect.height / 2,
        started: false,
      };

      setFlyingItems((current) => [...current, nextItem]);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setFlyingItems((current) => current.map((item) => (item.id === id ? { ...item, started: true } : item)));
        });
      });

      window.setTimeout(() => {
        setFlyingItems((current) => current.filter((item) => item.id !== id));
        triggerCartPulse();
      }, 2000);
    },
    [triggerCartPulse],
  );

  async function addToCart(
    productId: string,
    options?: { sourceRect?: DOMRect | null; imageUrl?: string | null; name?: string; destination?: "header" | "search" },
  ) {
    if (buttonStateById[productId] === "adding") return;

    const product = products.find((item) => item.id === productId);
    const trackedStock = !!product?.stock_enabled;
    const availableStock = Math.max(0, Number(product?.stock_quantity || 0));
    if (trackedStock && availableStock <= 0) return;

    const existing = readCart<StoredCartItem>(tenantSlug);
    const found = existing.find((item) => item.productId === productId);
    if (trackedStock && found && found.quantity >= availableStock) {
      setButtonStateById((current) => ({ ...current, [productId]: "added" }));
      window.setTimeout(() => {
        setButtonStateById((current) => ({ ...current, [productId]: "idle" }));
      }, 1200);
      return;
    }

    setButtonStateById((current) => ({ ...current, [productId]: "adding" }));
    if (options?.sourceRect || options?.imageUrl || options?.name) {
      launchAddToCartAnimation({
        imageUrl: options?.imageUrl ?? product?.image_url ?? null,
        name: options?.name ?? product?.name ?? "Menu item",
        sourceRect: options?.sourceRect ?? null,
        destination: options?.destination ?? "header",
      });
    }

    const updated = found
      ? existing.map((item) => (item.productId === productId ? { ...item, quantity: trackedStock ? Math.min(item.quantity + 1, availableStock) : item.quantity + 1 } : item))
      : [...existing, { productId, quantity: 1 }];

    writeCart(tenantSlug, updated);

    setButtonStateById((current) => ({ ...current, [productId]: "added" }));
    window.setTimeout(() => {
      setButtonStateById((current) => ({ ...current, [productId]: "idle" }));
    }, 1200);
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden="true">
        {flyingItems.map((item) => {
          const targetX = item.endCenterX - (item.startLeft + item.startWidth / 2);
          const targetY = item.endCenterY - (item.startTop + item.startHeight / 2);
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
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain bg-white p-3" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 text-4xl">📦</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky top-0 z-40 -mx-4 sm:-mx-5 lg:-mx-6 before:absolute before:inset-x-0 before:bottom-full before:h-16 before:content-['']" style={{ backgroundColor: brandSurface }}>
        <div className="border-b shadow-[0_22px_60px_rgba(15,23,42,0.10)]" style={{ borderColor: brandBorder, background: headerBackground }}>
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
                  <h1 className="max-w-[min(42vw,150px)] truncate text-center text-[1.35rem] font-semibold tracking-tight sm:max-w-none sm:text-[1.95rem] lg:text-[2.35rem]" style={{ color: headerText }}>{tenantName}</h1>
                )}
              </div>

              <div className="absolute left-0 top-1/2 flex -translate-y-1/2 items-center gap-2 sm:hidden">
                <CustomerAccountHeaderActions />
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
                  <svg viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
                <CartButton ref={cartButtonRef} tenantSlug={tenantSlug} tenantId={tenantId} accentColor={brandAccent} primaryColor={brandPrimary} pulseKey={cartPulseKey} checkoutBlocked={Boolean(trialState?.checkoutBlocked || trialState?.isTrialExpired)} checkoutBlockedMessage={trialState?.customerMessage || null} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border px-5 py-5 ring-1 ring-slate-200/70 sm:px-6 sm:py-6 lg:px-8 lg:py-7 lg:text-center" style={{ backgroundColor: welcomeBackground, borderColor: brandAccentBorder, boxShadow: `0 16px 36px ${welcomeShadow}22` }}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: welcomeLabel }}>{welcomeCustomerName ? `Welcome, ${welcomeCustomerName}` : "Welcome"}</p>
        <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight sm:text-[2.35rem] lg:text-[2.65rem]" style={{ color: welcomeHeadingColor }}>{welcomeHeading || "Browse the menu"}</h2>
        <p className="mt-3 max-w-3xl text-[14px] leading-6 sm:text-base sm:leading-7 lg:mx-auto" style={{ color: welcomeBody }}>
          {welcomeSubheading || "Tap into the details for more information, or add favourites straight to your order."}
        </p>
        <div className="mt-3 flex flex-col items-start gap-2 lg:items-center">
          {showFavouriteLoadingNote ? (
            <p className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur" style={{ color: welcomeBody }}>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />
              </svg>
              Loading your saved hearts quietly in the background
            </p>
          ) : null}

          {(canToggleFavourites || canToggleBuyAgain) ? (
            <div className="flex flex-wrap items-center gap-2 lg:justify-center">
              {canToggleFavourites ? (
                <button
                  type="button"
                  onClick={() => setFavouritesVisible((visible) => !visible)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] shadow-sm backdrop-blur transition hover:-translate-y-[1px] hover:bg-white focus:outline-none"
                  style={{ borderColor: welcomeBorder, color: welcomeHeadingColor }}
                  aria-expanded={favouritesVisible}
                  aria-controls="customer-favourites-section"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={favouritesVisible ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6l1.2 1.2L12 21l7.6-7.6 1.2-1.2a5.4 5.4 0 0 0 0-7.6Z" />
                  </svg>
                  {favouritesVisible ? "Hide favourites" : "View favourites"}
                </button>
              ) : null}

              {canToggleBuyAgain ? (
                <button
                  type="button"
                  onClick={() => setBuyAgainVisible((visible) => !visible)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.16em] shadow-sm backdrop-blur transition hover:-translate-y-[1px] hover:bg-white focus:outline-none"
                  style={{ borderColor: welcomeBorder, color: welcomeHeadingColor }}
                  aria-expanded={buyAgainVisible}
                  aria-controls="customer-buy-again-section"
                >
                  <span className="text-sm leading-none" aria-hidden="true">↻</span>
                  {buyAgainVisible ? "Hide buy again" : "Buy again"}
                </button>
              ) : null}
            </div>
          ) : null}

          {showNoFavouritesNote ? (
            <p className="text-[11px] font-semibold" style={{ color: welcomeBody }}>
              Tap the heart on any product to save it here.
            </p>
          ) : null}
        </div>
      </section>

      {shouldRenderFavouritesArea ? (
        <section id="customer-favourites-section" className="relative min-h-[228px] overflow-hidden rounded-[26px] border px-3 py-4 shadow-[0_20px_56px_rgba(120,53,15,0.22)] ring-1 ring-white/35 sm:min-h-[242px] sm:px-4 sm:py-5 lg:min-h-[248px] lg:px-5" style={{ backgroundColor: favouritesBackground, borderColor: favouritesBorder, color: favouritesText }} aria-label="Favourite products">
          <div className="pointer-events-none absolute -right-12 -top-16 h-[10.5rem] w-[10.5rem] rounded-full bg-amber-200/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-orange-300/18 blur-3xl" />
          <div className="relative z-10 mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: favouritesLabelText }}>Your favourites</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl" style={{ color: favouritesText }}>{favouritesReady ? "Saved favourites" : "Loading favourites"}</h2>
            </div>
            {favouriteProducts.length > 1 ? <p className="text-[10px] font-bold uppercase tracking-[0.15em] lg:hidden" style={{ color: favouritesText }}>Swipe sideways</p> : null}
          </div>

          {!favouritesReady ? (
            <div className="relative z-10 mx-auto flex max-w-full snap-x snap-mandatory gap-4 overflow-hidden px-[19vw] pb-1 pt-1 sm:px-[calc(50%_-_124px)] lg:px-[calc(50%_-_124px)]" aria-label="Loading favourite products">
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
            <div className="relative z-10 rounded-2xl border border-white/20 bg-white/12 px-4 py-3 text-sm font-semibold text-white/90">{favouritesMessage}</div>
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
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollFavourites("right")}
                    className="absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/55 bg-white/92 text-amber-950 shadow-[0_16px_34px_rgba(15,23,42,0.22)] backdrop-blur transition hover:scale-[1.04] hover:bg-white lg:inline-flex"
                    aria-label="Next favourite"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </>
              ) : null}
              <div ref={favouritesStripRef} className="mx-auto flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[19vw] pb-1 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-[calc(50%_-_124px)] lg:px-[calc(50%_-_124px)]">
                {favouriteProducts.map((product) => (
                  <FavouriteProductStripCard
                    key={product.id}
                    product={product}
                    moneySettings={moneySettings}
                    accentColor={brandAccent}
                    primaryColor={brandPrimary}
                    themeColors={storefrontTheme}
                    isBusy={Boolean(favouriteBusyById[product.id])}
                    onAddToCart={(productId, options) => void addToCart(productId, options)}
                    onRemoveFavourite={(productId) => void toggleFavourite(productId)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {shouldRenderBuyAgainArea ? (
        <section id="customer-buy-again-section" className="relative min-h-[228px] overflow-hidden rounded-[26px] border px-3 py-4 shadow-[0_20px_56px_rgba(120,53,15,0.22)] ring-1 ring-white/35 sm:min-h-[242px] sm:px-4 sm:py-5 lg:min-h-[248px] lg:px-5" style={{ backgroundColor: favouritesBackground, borderColor: favouritesBorder, color: favouritesText }} aria-label="Buy again products">
          <div className="pointer-events-none absolute -right-12 -top-16 h-[10.5rem] w-[10.5rem] rounded-full bg-amber-200/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-orange-300/18 blur-3xl" />
          <div className="relative z-10 mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: favouritesLabelText }}>Buy again</p>
              <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl" style={{ color: favouritesText }}>{buyAgainReady ? "Previously purchased" : "Loading previous buys"}</h2>
            </div>
            {buyAgainProducts.length > 1 ? <p className="text-[10px] font-bold uppercase tracking-[0.15em] lg:hidden" style={{ color: favouritesText }}>Swipe sideways</p> : null}
          </div>

          {!buyAgainReady ? (
            <div className="relative z-10 mx-auto flex max-w-full snap-x snap-mandatory gap-4 overflow-hidden px-[19vw] pb-1 pt-1 sm:px-[calc(50%_-_124px)] lg:px-[calc(50%_-_124px)]" aria-label="Loading buy again products">
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
            <div className="relative z-10 rounded-2xl border border-white/20 bg-white/12 px-4 py-3 text-sm font-semibold text-white/90">{buyAgainMessage}</div>
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
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollBuyAgain("right")}
                    className="absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/55 bg-white/92 text-amber-950 shadow-[0_16px_34px_rgba(15,23,42,0.22)] backdrop-blur transition hover:scale-[1.04] hover:bg-white lg:inline-flex"
                    aria-label="Next buy again product"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </>
              ) : null}
              <div ref={buyAgainStripRef} className="mx-auto flex max-w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[19vw] pb-1 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:px-[calc(50%_-_124px)] lg:px-[calc(50%_-_124px)]">
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
                    onAddToCart={(productId, options) => void addToCart(productId, options)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {categories.map((category) => {
        const categoryProducts = products.filter((product) => product.category_id === category.id);
        if (!categoryProducts.length) return null;

        return (
          <section key={category.id} className="mb-8 sm:mb-10">
            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
              <h2 className="text-[1.38rem] font-semibold tracking-tight sm:text-[1.95rem]" style={{ color: brandText }}>{category.name}</h2>
              <span className="rounded-full border bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] shadow-sm sm:px-3.5 sm:text-[11px] sm:tracking-[0.18em]" style={{ borderColor: brandBorder, color: brandSoftText }}>
                {categoryProducts.length} {categoryProducts.length === 1 ? "item" : "items"}
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
                  moneySettings={moneySettings}
                  accentColor={accentColor}
                  primaryColor={primaryColor}
                  themeColors={storefrontTheme}
                  isFavourite={favouriteIdSet.has(product.id)}
                  favouriteBusy={Boolean(favouriteBusyById[product.id])}
                  onToggleFavourite={(productId) => void toggleFavourite(productId)}
                  onAddToCartAnimation={(payload) => launchAddToCartAnimation({ ...payload, destination: "header" })}
                />
              ))}
            </div>
          </section>
        );
      })}

      {footerIconLinks.length ? (
        <section className="rounded-[28px] border px-5 py-5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 sm:px-6 sm:py-6 lg:px-8 lg:py-7" style={{ backgroundColor: footerBackground, borderColor: brandBorder, color: footerText }}>
          <div className="mx-auto flex w-full max-w-[244px] flex-wrap items-center justify-center gap-3 sm:max-w-[256px]" aria-label="Store footer links">
            {footerIconLinks.map((link) => (
              <FooterIcon key={link.label} label={link.label} href={link.href || null}>{link.icon}</FooterIcon>
            ))}
          </div>
        </section>
      ) : null}

      <footer className="rounded-[24px] border px-5 py-5 text-center text-sm shadow-sm sm:px-6" style={{ backgroundColor: footerBackground, borderColor: brandBorder, color: footerText }}>
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          {showOrduvaReferralAd !== false ? (
            <div className="w-full overflow-hidden rounded-[24px] border border-[#FF6A3D]/20 bg-[linear-gradient(135deg,#FFF7F0_0%,#FFFFFF_52%,#FFE7D9_100%)] p-4 text-left shadow-[0_18px_45px_rgba(14,14,16,0.08)] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C84F2A]">Powered by Orduva</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight text-[#0E0E10]">Do you need a store like this?</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5C5F66]">Launch your own branded ordering storefront with products, customer accounts and simple order management.</p>
                </div>
                <a
                  href={referralSignupHref}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:-translate-y-[1px] hover:bg-[#E95B30]"
                >
                  Start free trial
                </a>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-[4px] px-1.5 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.20em] text-white" style={{ backgroundColor: footerBadgeBackground }}>Orduva Online</span>
            <span className="inline-flex rounded-[4px] border border-slate-200 bg-white px-1.5 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{version.replace("Ver: ", "V ")}</span>
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
          className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/62 px-4 py-6 backdrop-blur-[3px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="favourite-login-title"
          onClick={() => setFavouriteLoginPromptOpen(false)}
        >
          <div className="w-full">
            <div
              className="relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_34px_100px_rgba(15,23,42,0.30)] ring-1 ring-slate-900/5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: brandAccent }} />
              <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: brandPrimary }} />
              <div className="relative px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
                <button
                  type="button"
                  onClick={() => setFavouriteLoginPromptOpen(false)}
                  className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
                  aria-label="Close favourites login prompt"
                >
                  ×
                </button>

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] border border-white bg-white text-3xl shadow-[0_18px_45px_rgba(15,23,42,0.14)]" style={{ color: brandAccent }} aria-hidden="true">
                  ♥
                </div>

                <div className="mt-5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: brandAccent }}>Save your favourites</p>
                  <h2 id="favourite-login-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-[1.65rem]">Login or create an account first</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Favourites are saved to your customer account so they are ready the next time you open this store. Login, or set up an account, then tap the heart again.
                  </p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a
                    href="/account/login"
                    className="inline-flex min-h-[48px] items-center justify-center rounded-[17px] border px-4 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)] transition hover:-translate-y-[1px]"
                    style={{ backgroundColor: brandPrimary, borderColor: brandPrimary }}
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] overscroll-none" onClick={() => setSearchOpen(false)}>
          <div className="flex min-h-dvh items-center justify-center px-4 py-6 sm:px-5 sm:py-7 lg:px-6 lg:py-8 xl:px-8 xl:py-10">
            <div
              className="flex max-h-[calc(100dvh-3.25rem)] w-full max-w-[1120px] flex-col overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:max-h-[calc(100dvh-4rem)] sm:rounded-[28px] lg:max-h-[calc(100dvh-5rem)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="relative border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/50 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-8 lg:pb-7 lg:pt-6">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Search menu</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">Find something quickly</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Search by product name, keyword, or narrow the results to a category.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div ref={searchCartIndicatorRef} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="9" cy="20" r="1" />
                        <circle cx="18" cy="20" r="1" />
                        <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H7" />
                      </svg>
                      <span>{cartCount}</span>
                    </div>
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
                      onChange={(event) => setActiveCategoryId(event.target.value)}
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

              <div className="modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4 sm:px-6 sm:pb-7 sm:pt-5 lg:px-7 lg:pb-8 lg:pt-6 xl:px-8 xl:pb-10 xl:pt-7">
                <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <p>{filteredProducts.length} {filteredProducts.length === 1 ? "result" : "results"}</p>
                  {(query.trim() || activeCategoryId !== "all") ? (
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
                      const categoryName = categories.find((category) => category.id === product.category_id)?.name || "Menu item";
                      const state = buttonStateById[product.id] || "idle";
                      const thumbId = `search-thumb-${product.id}`;
                      const searchTrackedStock = !!product.stock_enabled;
                      const searchAvailableStock = Math.max(0, Number(product.stock_quantity || 0));
                      const searchLowStockThreshold = Math.max(0, Number(product.low_stock_threshold || 5));
                      const searchOutOfStock = searchTrackedStock && searchAvailableStock <= 0;
                      const searchLowStock = searchTrackedStock && searchAvailableStock > 0 && searchAvailableStock <= searchLowStockThreshold;
                      return (
                        <div key={product.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div id={thumbId} className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] font-medium text-slate-500">No image</div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 flex-col items-center text-center">
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                <h4 className="text-lg font-semibold text-slate-900">{product.name}</h4>
                                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-500 ring-1 ring-slate-200">{categoryName}</span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {stripHtml(product.description).slice(0, 140) || "Freshly prepared and ready to order."}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <p className="text-sm font-semibold text-slate-900">{formatMoney(Number(product.price), moneySettings)}</p>
                                  {state === "added" ? (
                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                      In cart: {cartCount}
                                    </span>
                                  ) : null}
                                  {searchTrackedStock && (searchOutOfStock || searchLowStock) ? (
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${searchOutOfStock ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-orange-50 text-orange-700 ring-1 ring-orange-100"}`}>
                                      {searchOutOfStock ? "Out of stock" : `Only ${searchAvailableStock} left`}
                                    </span>
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sourceRect = document.getElementById(thumbId)?.getBoundingClientRect() || null;
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
                                  {searchOutOfStock ? "Sold out" : state === "adding" ? "Adding..." : state === "added" ? "Added ✓" : "Add"}
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
                    <p className="text-lg font-semibold text-slate-900">No matching products</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Try another search term or switch the category filter.</p>
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
