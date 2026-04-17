"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/menu/ProductCard";

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
  const [query, setQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");

  const normalizedQuery = query.trim().toLowerCase();

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.category_id, (counts.get(product.category_id) || 0) + 1);
    }
    return counts;
  }, [products]);

  const filteredCategories = useMemo(() => {
    return categories
      .map((category) => {
        const categoryProducts = products.filter((product) => {
          const matchesCategory = activeCategoryId === "all" || product.category_id === activeCategoryId;
          if (!matchesCategory || product.category_id !== category.id) return false;

          if (!normalizedQuery) return true;

          const haystack = [product.name, stripHtml(product.description), category.name].join(" ").toLowerCase();
          return haystack.includes(normalizedQuery);
        });

        return { ...category, products: categoryProducts };
      })
      .filter((category) => category.products.length > 0);
  }, [categories, products, activeCategoryId, normalizedQuery]);

  const totalMatches = filteredCategories.reduce((sum, category) => sum + category.products.length, 0);
  const hasActiveFilters = normalizedQuery.length > 0 || activeCategoryId !== "all";

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Browse the menu</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Find a product quickly</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Search by product name, description, or category, then narrow the menu using the category filters below.
            </p>
          </div>

          <div className="w-full max-w-xl">
            <label className="sr-only" htmlFor="storefront-search">Search products</label>
            <div className="flex min-h-[56px] items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 shadow-sm ring-0 transition focus-within:border-emerald-400 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(16,185,129,0.10)]">
              <span className="mr-3 text-lg text-slate-400">⌕</span>
              <input
                id="storefront-search"
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
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setActiveCategoryId("all")}
            className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition ${
              activeCategoryId === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            All categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
              className={`inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition ${
                activeCategoryId === category.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {category.name}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeCategoryId === category.id ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                {categoryCounts.get(category.id) || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            {totalMatches} {totalMatches === 1 ? "product" : "products"} shown
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategoryId("all");
              }}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      </section>

      {filteredCategories.length ? (
        filteredCategories.map((category) => (
          <section key={category.id} className="mb-10">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-slate-900">{category.name}</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wide text-slate-600">
                {category.products.length} {category.products.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.products.map((product) => (
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
        ))
      ) : (
        <section className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">No products found</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Try a different search term or clear the current category filter.
          </p>
          {hasActiveFilters ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategoryId("all");
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Reset search
              </button>
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
