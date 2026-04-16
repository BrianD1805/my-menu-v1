"use client";

import { useEffect, useState } from "react";
import { readCart, writeCart } from "@/lib/cart";

type Props = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  price: number;
  tenantSlug: string;
};

type StoredCartItem = {
  productId: string;
  quantity: number;
};

export default function ProductCard({ id, name, description, imageUrl, price, tenantSlug }: Props) {
  const [buttonState, setButtonState] = useState<"idle" | "adding" | "added">("idle");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0;
  const fullDescription = description?.trim() || "No additional details yet.";

  useEffect(() => {
    if (!detailsOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [detailsOpen]);

  function addToCart() {
    setButtonState("adding");

    const existing = readCart<StoredCartItem>(tenantSlug);
    const found = existing.find((x) => x.productId === id);

    const updated = found
      ? existing.map((x) =>
          x.productId === id ? { ...x, quantity: x.quantity + 1 } : x
        )
      : [...existing, { productId: id, quantity: 1 }];

    writeCart(tenantSlug, updated);

    window.setTimeout(() => setButtonState("added"), 180);
    window.setTimeout(() => setButtonState("idle"), 1400);
  }

  function buttonLabel() {
    if (buttonState === "adding") return "Adding...";
    if (buttonState === "added") return "1 added ✓";
    return "Add to order";
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md h-full">
        <div className="flex items-stretch gap-0 h-full">
          <div className="w-24 shrink-0 p-2.5 md:w-20 lg:w-20 xl:w-20">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="block w-full text-left"
              aria-label={`View details for ${name}`}
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5">
                {hasImage ? (
                  <img
                    src={imageUrl!}
                    alt={name}
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-3 text-center text-gray-500">
                    <div className="mb-1 text-2xl">📦</div>
                    <p className="text-xs font-medium text-gray-600">Image coming soon</p>
                  </div>
                )}
              </div>
            </button>

            <p className="mt-1.5 text-center text-base font-semibold tracking-tight text-gray-900 md:hidden">
              £{price.toFixed(2)}
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between p-3 md:p-2.5 lg:p-2.5">
            <div>
              <button type="button" onClick={() => setDetailsOpen(true)} className="text-left">
                <h3 className="text-base font-semibold leading-tight md:text-[15px] lg:text-[15px]">{name}</h3>
              </button>
              {description ? (
                <p
                  className="mt-1.5 pr-0 text-[12px] leading-[1.35rem] text-gray-600"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {description}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="mt-1 text-[11px] font-medium text-gray-500 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-800"
              >
                View details
              </button>
            </div>

            <div className="mt-2.5 flex items-center justify-end gap-2 md:justify-between">
              <p className="hidden text-base font-semibold tracking-tight text-gray-900 md:block">£{price.toFixed(2)}</p>

              <button
                className="ml-auto inline-flex min-h-9 min-w-[6.75rem] items-center justify-center whitespace-nowrap rounded-xl bg-gray-700/85 px-3 py-2 text-[13px] font-medium text-white shadow-sm transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-80"
                onClick={addToCart}
                disabled={buttonState === "adding"}
              >
                {buttonLabel()}
              </button>
            </div>
          </div>
        </div>
      </div>

      {detailsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-[2px] sm:items-center sm:p-6 lg:p-8">
          <div className="max-h-[94vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:max-w-3xl lg:max-w-[52rem] xl:max-w-[56rem]">
            <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/60 px-5 pb-5 pt-5 sm:px-7 sm:pb-6 sm:pt-6 lg:px-8 lg:pb-7 lg:pt-7">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Product details</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem] lg:text-[2rem]">{name}</h3>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      £{price.toFixed(2)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                      Ready to order
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
                  aria-label="Close details"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="max-h-[calc(94vh-220px)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6 lg:px-8 lg:py-7">
              <div className="grid gap-6 sm:grid-cols-[0.85fr_1.15fr] sm:gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:gap-6">
                <div className="overflow-hidden rounded-[24px] bg-slate-100 ring-1 ring-black/5">
                  {hasImage ? (
                    <img
                      src={imageUrl!}
                      alt={name}
                      className="h-72 w-full object-cover object-center sm:h-full sm:min-h-[18rem] lg:min-h-[19rem]"
                    />
                  ) : (
                    <div className="flex h-72 w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 sm:h-full sm:min-h-[18rem] lg:min-h-[19rem]">
                      <div className="mb-2 text-5xl">📦</div>
                      <p className="text-sm font-medium text-slate-600">Image coming soon</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between rounded-[24px] border border-slate-100 bg-slate-50/70 p-4 sm:p-5 lg:p-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Overview</p>
                    <p className="mt-3 text-[15px] leading-6 text-slate-700 sm:text-[15px] lg:text-base lg:leading-6">
                      {fullDescription}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3 lg:mt-6 lg:space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Why this view matters</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        This product view is designed to grow with restaurants, takeaways, and general stores, with room for fuller descriptions,
                        options, highlights, and future business-specific details.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Price</p>
                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">£{price.toFixed(2)}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Ordering</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Add this item now, or close and continue browsing the menu.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-7 sm:py-4 lg:px-8 lg:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:min-h-12 sm:px-6 sm:py-2.5 sm:text-[15px]"
                >
                  Back to menu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToCart();
                    setDetailsOpen(false);
                  }}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gray-700/85 px-7 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-80 sm:min-h-12 sm:px-7 sm:py-2.5 sm:text-[15px]"
                  disabled={buttonState === "adding"}
                >
                  {buttonLabel()}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
