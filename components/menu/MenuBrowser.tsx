"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/menu/ProductCard";
import { StoredCartItem, readCart, writeCart } from "@/lib/cart";

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
  categories,
  products,
}: {
  tenantSlug: string;
  categories: Category[];
  products: Product[];
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [buttonStateById, setButtonStateById] = useState<Record<string, "idle" | "adding" | "added">>({});

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
    <div className="space-y-8">
      <section className="rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Browse the menu</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Freshly prepared and ready to order</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Explore the menu by category, or use the search button when you want to find something quickly.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <span className="text-base">⌕</span>
            Search menu
          </button>
        </div>
      </section>

      {categories.map((category) => {
        const categoryProducts = products.filter((product) => product.category_id === category.id);
        if (!categoryProducts.length) return null;

        return (
          <section key={category.id} className="mb-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-slate-900">{category.name}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600">
                {categoryProducts.length} {categoryProducts.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px]">
          <div className="flex min-h-dvh items-center justify-center px-4 py-5 sm:p-5 lg:p-6 xl:p-8">
            <div className="my-auto flex w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-3rem)]">
              <div className="relative border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/70 px-5 pb-5 pt-5 sm:px-6 lg:px-8">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Search menu</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Find something quickly</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Type a product name, keyword, or choose a category. Results appear here without cluttering the page.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 shadow-sm transition hover:text-slate-900"
                    aria-label="Close search"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_220px]">
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

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <div className="mb-4 flex items-center justify-between gap-3 text-sm text-slate-600">
                  <p>{filteredProducts.length} {filteredProducts.length === 1 ? "result" : "results"}</p>
                  {(query.trim() || activeCategoryId !== "all") ? (
                    <button
                      type="button"
                      onClick={() => { setQuery(""); setActiveCategoryId("all"); }}
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
                                <p className="text-sm font-semibold text-slate-900">£{Number(product.price).toFixed(2)}</p>
                                <button
                                  type="button"
                                  onClick={() => void addToCart(product.id)}
                                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                  {state === "adding" ? "Adding..." : state === "added" ? "1 added ✓" : "Add to order"}
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
