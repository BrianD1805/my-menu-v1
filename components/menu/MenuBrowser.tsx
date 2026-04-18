"use client";

import { useEffect, useMemo, useState } from "react";
import CartButton from "@/components/menu/CartButton";
import ProductCard from "@/components/menu/ProductCard";
import { StoredCartItem, readCart, subscribeToCartUpdates, writeCart } from "@/lib/cart";

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
  welcomeHeading,
  welcomeSubheading,
  primaryColor,
  accentColor,
}: {
  tenantSlug: string;
  tenantName: string;
  version: string;
  categories: Category[];
  products: Product[];
  logoUrl?: string | null;
  welcomeHeading?: string;
  welcomeSubheading?: string;
  primaryColor?: string;
  accentColor?: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [buttonStateById, setButtonStateById] = useState<Record<string, "idle" | "adding" | "added">>({});
  const [cartCount, setCartCount] = useState(0);

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
      <div className="sticky top-0 z-40 -mx-4 sm:-mx-5 lg:-mx-6 before:absolute before:inset-x-0 before:bottom-full before:h-16 before:bg-[#f4f8f4] before:content-['']">
        <div className="border-b border-slate-200/85 bg-[linear-gradient(180deg,#f7fbf7_0%,#eef5ef_50%,#e6eee7_100%)] shadow-[0_22px_60px_rgba(15,23,42,0.10)]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-5 sm:py-5.5 lg:px-6 lg:py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border bg-white/95 text-center shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:h-12 sm:w-12 sm:rounded-[20px]" style={accentColor ? { borderColor: `${accentColor}33` } : undefined}>
                  {logoUrl ? <img src={logoUrl} alt={tenantName} className="h-full w-full object-cover" loading="lazy" /> : <span className="text-[10px] font-bold leading-tight tracking-[0.16em] text-slate-600">{version.replace("Ver: ", "V ")}</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400 sm:text-[11px] sm:tracking-[0.28em]">Order online</p>
                  <h1 className="truncate text-[1.56rem] font-semibold tracking-tight text-slate-950 sm:text-[1.95rem] lg:text-[2.35rem]" style={primaryColor ? { color: primaryColor } : undefined}>{tenantName}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-white/95 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:border-emerald-200 hover:bg-white sm:h-11 sm:w-11"
                  aria-label="Search menu"
                  title="Search menu"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
                <CartButton tenantSlug={tenantSlug} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.99),rgba(244,248,244,0.97))] px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/70 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Welcome</p>
        <h2 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-slate-900 sm:text-[2.35rem] lg:text-[2.65rem]" style={primaryColor ? { color: primaryColor } : undefined}>{welcomeHeading || "Browse the menu"}</h2>
        <p className="mt-3 max-w-3xl text-[14px] leading-6 text-slate-600 sm:text-base sm:leading-7">
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
              <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 shadow-sm sm:px-3.5 sm:text-[11px] sm:tracking-[0.18em]">
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
                />
              ))}
            </div>
          </section>
        );
      })}

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

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-lg font-semibold text-slate-900">{product.name}</h4>
                                <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold tracking-wide text-slate-500 ring-1 ring-slate-200">{categoryName}</span>
                              </div>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {stripHtml(product.description).slice(0, 140) || "Freshly prepared and ready to order."}
                              </p>
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <p className="text-sm font-semibold text-slate-900">£{Number(product.price).toFixed(2)}</p>
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
