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
  return "inline-flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/70 bg-white/90 text-slate-700 shadow-[0_14px_34px_rgba(15,23,42,0.10)] ring-1 ring-slate-900/5 backdrop-blur-sm transition hover:-translate-y-[2px] hover:scale-[1.03] hover:border-white hover:bg-white hover:text-slate-950 hover:shadow-[0_18px_42px_rgba(15,23,42,0.16)] focus:outline-none focus:ring-2 focus:ring-slate-300 active:translate-y-0 active:scale-[0.98]";
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
      {children}
    </a>
  );
}

function PhoneIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.1 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L9 10.69a16 16 0 0 0 4.31 4.31l1.25-1.25a2 2 0 0 1 2.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0 1 22 16.92z" /></svg>;
}
function WhatsAppIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12.04 2a9.86 9.86 0 0 0-8.5 14.86L2.5 22l5.29-1a9.9 9.9 0 1 0 4.25-19Zm0 17.9a8.02 8.02 0 0 1-4.08-1.12l-.29-.17-3.14.6.61-3.05-.19-.31a7.98 7.98 0 1 1 7.09 4.05Zm4.39-5.99c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" /></svg>;
}
function EmailIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>;
}
function SocialIcon({ label }: { label: string }) {
  return <span className="text-xs font-black uppercase tracking-tight">{label}</span>;
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
  const brandAccentBorder = welcomeBorder;
  const phoneHref = cleanDialString(contactPhone) ? `tel:${cleanDialString(contactPhone)}` : null;
  const whatsAppHref = cleanWhatsAppNumber(contactWhatsApp || contactPhone) ? `https://wa.me/${cleanWhatsAppNumber(contactWhatsApp || contactPhone)}` : null;
  const emailHref = contactEmail?.trim() ? `mailto:${contactEmail.trim()}` : null;
  const socialLinks = [
    { label: "Facebook", short: "f", href: normaliseExternalUrl(socialFacebookUrl) },
    { label: "Instagram", short: "IG", href: normaliseExternalUrl(socialInstagramUrl) },
    { label: "TikTok", short: "TT", href: normaliseExternalUrl(socialTikTokUrl) },
    { label: "X", short: "X", href: normaliseExternalUrl(socialXUrl) },
    { label: "Website", short: "www", href: normaliseExternalUrl(socialWebsiteUrl) },
  ].filter((item) => Boolean(item.href));

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
        } else if (!cancelled) {
          setWelcomeCustomerName(null);
        }
      } catch {
        if (!cancelled) setWelcomeCustomerName(null);
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

    setButtonStateById((current) => ({ ...current, [productId]: "adding" }));

    const product = products.find((item) => item.id === productId);
    if (options?.sourceRect || options?.imageUrl || options?.name) {
      launchAddToCartAnimation({
        imageUrl: options?.imageUrl ?? product?.image_url ?? null,
        name: options?.name ?? product?.name ?? "Menu item",
        sourceRect: options?.sourceRect ?? null,
        destination: options?.destination ?? "header",
      });
    }

    const existing = readCart<StoredCartItem>(tenantSlug);
    const found = existing.find((item) => item.productId === productId);
    const updated = found
      ? existing.map((item) => (item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item))
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
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
                <CartButton ref={cartButtonRef} tenantSlug={tenantSlug} tenantId={tenantId} accentColor={brandAccent} primaryColor={brandPrimary} pulseKey={cartPulseKey} />
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
      </section>

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
                  moneySettings={moneySettings}
                  accentColor={accentColor}
                  primaryColor={primaryColor}
                  themeColors={storefrontTheme}
                  onAddToCartAnimation={(payload) => launchAddToCartAnimation({ ...payload, destination: "header" })}
                />
              ))}
            </div>
          </section>
        );
      })}

      <section className="rounded-[28px] border px-5 py-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 sm:px-6 sm:py-7 lg:px-8 lg:py-8" style={{ backgroundColor: footerBackground, borderColor: brandBorder, color: footerText }}>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Storefront footer</p>
          <h3 className="mt-2 text-[1.2rem] font-semibold tracking-tight sm:text-[1.45rem]" style={{ color: footerText }}>{tenantName}</h3>
          <p className="mt-3 max-w-2xl text-center text-sm leading-6" style={{ color: footerText }}>{footerBlurb || "Thank you for ordering with us."}</p>
          <p className="mt-4 max-w-2xl text-center text-xs leading-5" style={{ color: footerText }}>{footerNotice || "Prices and availability may change without notice."}</p>

          <div className="mt-6 flex w-full flex-col items-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2.5" aria-label="Store contact links">
              <FooterIcon label="Call store" href={phoneHref}><PhoneIcon /></FooterIcon>
              <FooterIcon label="WhatsApp store" href={whatsAppHref}><WhatsAppIcon /></FooterIcon>
              <FooterIcon label="Email store" href={emailHref}><EmailIcon /></FooterIcon>
            </div>
            {socialLinks.length ? (
              <div className="flex flex-wrap items-center justify-center gap-2.5" aria-label="Store social links">
                {socialLinks.map((link) => (
                  <FooterIcon key={link.label} label={link.label} href={link.href || null}><SocialIcon label={link.short} /></FooterIcon>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <footer className="rounded-[24px] border px-5 py-5 text-center text-sm shadow-sm sm:px-6" style={{ backgroundColor: footerBackground, borderColor: brandBorder, color: footerText }}>
        <div className="flex flex-col items-center justify-center gap-3 text-center">
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
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                                >
                                  {state === "adding" ? "Adding..." : state === "added" ? "Added ✓" : "Add"}
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
