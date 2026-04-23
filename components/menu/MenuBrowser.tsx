"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import CartButton from "@/components/menu/CartButton";
import ProductCard from "@/components/menu/ProductCard";
import { StoredCartItem, readCart, subscribeToCartUpdates, writeCart } from "@/lib/cart";
import { buildMoneySettings, formatMoney, type MoneyFormatSettings } from "@/lib/money";

const CustomerAccountHeaderActions = dynamic(
  () => import("@/components/account/CustomerAccountHeaderActions"),
  {
    ssr: false,
    loading: () => (
      <div className="pointer-events-none flex items-center gap-2 sm:gap-2.5">
        <span className="inline-flex h-10 w-10 animate-pulse rounded-2xl border border-slate-200 bg-white/80 sm:h-11 sm:w-11" />
        <span className="hidden sm:inline-flex h-10 w-10 animate-pulse rounded-2xl border border-slate-200 bg-white/80 sm:h-11 sm:w-11" />
      </div>
    ),
  }
);


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

function stripHtml(value: string | null | undefined) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function MenuBrowser({
  tenantSlug,
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
}: {
  tenantSlug: string;
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
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [buttonStateById, setButtonStateById] = useState<Record<string, "idle" | "adding" | "added">>({});
  const [cartCount, setCartCount] = useState(0);

  const brandPrimary = primaryColor || "#7B1E22";
  const brandAccent = accentColor || "#C7922F";
  const brandSurface = backgroundTint || "#F8F4F0";
  const brandBorder = borderColor || "#D9C7A3";
  const brandText = textColor || "#2B2B2B";
  const brandAccentBorder = brandBorder;

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

  async function addToCart(productId: string) {
    if (buttonStateById[productId] === "adding") return;

    setButtonStateById((current) => ({ ...current, [productId]: "adding" }));

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
      <div className="sticky top-0 z-40 -mx-4 sm:-mx-5 lg:-mx-6 before:absolute before:inset-x-0 before:bottom-full before:h-16 before:content-['']" style={{ backgroundColor: brandSurface }}>
        <div className="border-b shadow-[0_22px_60px_rgba(15,23,42,0.10)]" style={{ borderColor: brandBorder, background: `linear-gradient(180deg, ${brandSurface} 0%, color-mix(in srgb, ${brandSurface} 80%, white) 50%, white 100%)` }}>
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-5 sm:py-5.5 lg:px-6 lg:py-6">
            <div className="relative flex items-center justify-center min-h-[78px] sm:min-h-[86px] lg:min-h-[94px]">
              <div className="flex items-center justify-center">
                {headerLogoUrl ? (
                  <img
                    src={headerLogoUrl}
                    alt={tenantName}
                    className="h-auto max-h-[52px] w-auto max-w-[200px] object-contain sm:max-h-[60px] sm:max-w-[240px] lg:max-h-[68px] lg:max-w-[280px]"
                    loading="lazy"
                  />
                ) : (
                  <h1 className="truncate text-[1.56rem] font-semibold tracking-tight sm:text-[1.95rem] lg:text-[2.35rem]" style={{ color: brandText }}>{tenantName}</h1>
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
                  style={accentColor ? { borderColor: `${accentColor}44` } : undefined}
                  aria-label="Search menu"
                  title="Search menu"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
                <CartButton tenantSlug={tenantSlug} accentColor={brandAccent} primaryColor={brandPrimary} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.99),rgba(248,244,240,0.97))] px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/70 sm:px-6 sm:py-6 lg:px-8 lg:py-7" style={{ borderColor: brandAccentBorder, boxShadow: `0 18px 50px color-mix(in srgb, ${brandPrimary} 10%, rgba(15,23,42,0.07))` }}>
        <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: brandAccent }}>Welcome</p>
        <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight sm:text-[2.35rem] lg:text-[2.65rem]" style={{ color: brandPrimary }}>{welcomeHeading || "Browse the menu"}</h2>
        <p className="mt-3 max-w-3xl text-[14px] leading-6 sm:text-base sm:leading-7" style={{ color: brandText }}>
          {welcomeSubheading || "Tap into the details for more information, or add favourites straight to your order."}
        </p>
      </section>

      {categories.map((category) => {
        const categoryProducts = products.filter((product) => product.category_id === category.id);
        if (!categoryProducts.length) return null;

        return (
          <section key={category.id} className="mb-8 sm:mb-10">
            <div className="mb-4 flex items-center justify-between gap-3 sm:mb-5">
              <h2 className="text-[1.38rem] font-semibold tracking-tight text-slate-900 sm:text-[1.95rem]">{category.name}</h2>
              <span className="rounded-full border bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-sm sm:px-3.5 sm:text-[11px] sm:tracking-[0.18em]" style={accentColor ? { borderColor: `${accentColor}33`, color: accentColor } : undefined}>
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
                />
              ))}
            </div>
          </section>
        );
      })}

      <section className="rounded-[28px] border border-white/80 bg-white px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Storefront footer</p>
            <h3 className="mt-2 text-[1.2rem] font-semibold tracking-tight text-slate-900 sm:text-[1.45rem]">{tenantName}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{footerBlurb || "Thank you for ordering with us."}</p>
            <p className="mt-4 text-xs leading-5 text-slate-500">{footerNotice || "Prices and availability may change without notice."}</p>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Business details</p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              {contactPhone ? <p><span className="font-semibold text-slate-900">Phone:</span> {contactPhone}</p> : null}
              {contactWhatsApp ? <p><span className="font-semibold text-slate-900">WhatsApp:</span> {contactWhatsApp}</p> : null}
              {contactEmail ? <p><span className="font-semibold text-slate-900">Email:</span> {contactEmail}</p> : null}
              {contactAddress ? <p><span className="font-semibold text-slate-900">Address:</span> {contactAddress}</p> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">{moneySettings.currencyCode}</span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">{formatMoney(1000, moneySettings)} sample</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="rounded-[24px] border border-slate-200 bg-white/90 px-5 py-5 text-sm text-slate-600 shadow-sm sm:px-6" style={accentColor ? { borderColor: `${accentColor}22` } : undefined}>
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex rounded-[4px] px-1.5 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.20em] text-white" style={accentColor ? { backgroundColor: accentColor } : undefined}>Orduva Online</span>
            <span className="inline-flex rounded-[4px] border border-slate-200 bg-white px-1.5 py-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{version.replace("Ver: ", "V ")}</span>
          </div>

          <a
            href="/admin/login"
            className="inline-flex min-h-[38px] items-center justify-center rounded-[14px] border border-slate-200 bg-white px-4 py-2 text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            title="Temporary admin login link"
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
                    <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
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
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
                      aria-label="Close search"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_260px]">
                  <div className="flex min-h-[54px] items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-emerald-400 focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.10)]">
                    <span className="mr-3 text-lg text-slate-400">⌕</span>
                    <input
                      autoFocus
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search products or categories"
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="ml-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
                        aria-label="Clear search"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>

                  <select
                    value={activeCategoryId}
                    onChange={(event) => setActiveCategoryId(event.target.value)}
                    className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                      return (
                        <div key={product.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
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
                                  onClick={() => void addToCart(product.id)}
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
