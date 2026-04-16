"use client";

import { useState } from "react";
import { StoredCartItem, readCart, writeCart } from "@/lib/cart";

type Props = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  tenantSlug: string;
};

export default function ProductCard({ id, name, description, imageUrl, price, tenantSlug }: Props) {
  const [buttonState, setButtonState] = useState<"idle" | "adding" | "added">("idle");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const hasImage = !!imageUrl;
  const fullDescription = description?.trim() || "A fresh favourite from the menu, ready to add to your order.";

  async function addToCart() {
    if (buttonState === "adding") return;

    setButtonState("adding");

    const existing = readCart<StoredCartItem>(tenantSlug);
    const found = existing.find((item) => item.productId === id);
    const updated = found
      ? existing.map((item) => (item.productId === id ? { ...item, quantity: item.quantity + 1 } : item))
      : [...existing, { productId: id, quantity: 1 }];

    writeCart(tenantSlug, updated);

    setButtonState("added");
    setTimeout(() => setButtonState("idle"), 1200);
  }

  function buttonLabel() {
    if (buttonState === "adding") return "Adding...";
    if (buttonState === "added") return "1 added ✓";
    return "Add to order";
  }

  return (
    <>
      <div className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="flex h-full items-stretch gap-0">
          <div className="w-24 shrink-0 p-2.5 md:w-24 lg:w-24 xl:w-24">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="block w-full text-left"
              aria-label={`View details for ${name}`}
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5">
                {hasImage ? (
                  <img src={imageUrl!} alt={name} className="h-full w-full object-cover object-center" loading="lazy" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-3 text-center text-gray-500">
                    <div className="mb-1 text-2xl">📦</div>
                    <p className="text-xs font-medium text-gray-600">Image coming soon</p>
                  </div>
                )}
              </div>
            </button>

            <p className="mt-1.5 text-center text-base font-semibold tracking-tight text-gray-900 md:hidden">£{price.toFixed(2)}</p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between p-3.5 lg:p-3.5">
            <div>
              <button type="button" onClick={() => setDetailsOpen(true)} className="text-left">
                <h3 className="text-base font-semibold leading-tight lg:text-[15px] xl:text-base">{name}</h3>
              </button>
              {description ? (
                <p
                  className="mt-1.5 pr-1 text-[13px] leading-5 text-gray-600"
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
                className="mt-1.5 text-xs font-medium text-gray-500 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-800"
              >
                View details
              </button>
            </div>

            <div className="mt-3 flex items-center justify-end gap-3 md:justify-between">
              <p className="hidden text-lg font-semibold tracking-tight text-gray-900 md:block">£{price.toFixed(2)}</p>

              <button
                className="ml-auto inline-flex min-h-10 min-w-[7.75rem] items-center justify-center whitespace-nowrap rounded-xl bg-gray-700/85 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-80"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-[2px]">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="my-auto w-full max-w-4xl overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
              <div className="relative border-b border-slate-100 bg-gradient-to-br from-white via-slate-50 to-emerald-50/50 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 lg:px-8 lg:pb-7 lg:pt-6">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-slate-700 to-emerald-400" />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Product details</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">{name}</h3>
                    <div className="mt-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                        £{price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(false)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-900"
                    aria-label="Close details"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="max-h-[calc(100dvh-11rem)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-7">
                  <div className="overflow-hidden rounded-[24px] bg-slate-100 ring-1 ring-black/5">
                    {hasImage ? (
                      <img src={imageUrl!} alt={name} className="h-72 w-full object-cover object-center sm:h-[24rem] lg:h-[29rem]" />
                    ) : (
                      <div className="flex h-72 w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 sm:h-[24rem] lg:h-[29rem]">
                        <div className="mb-2 text-5xl">📦</div>
                        <p className="text-sm font-medium text-slate-600">Image coming soon</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:p-5 lg:p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Description</p>
                      <p className="mt-3 text-[15px] leading-7 text-slate-700 lg:text-base">{fullDescription}</p>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Order note</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        Add this item now, or close this window and continue browsing the menu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <button
                    type="button"
                    onClick={() => setDetailsOpen(false)}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:px-7"
                  >
                    Back to menu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      addToCart();
                      setDetailsOpen(false);
                    }}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gray-700/85 px-7 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-80 lg:px-8"
                    disabled={buttonState === "adding"}
                  >
                    {buttonLabel()}
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
