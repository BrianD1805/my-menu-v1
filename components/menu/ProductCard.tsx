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
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-stretch gap-0">
          <div className="w-28 shrink-0 p-2.5 sm:w-44 sm:p-3">
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

            <p className="mt-2 text-center text-lg font-semibold tracking-tight text-gray-900 sm:hidden">
              £{price.toFixed(2)}
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
            <div>
              <button type="button" onClick={() => setDetailsOpen(true)} className="text-left">
                <h3 className="text-lg font-semibold leading-tight sm:text-xl">{name}</h3>
              </button>
              {description ? (
                <p
                  className="mt-2 pr-1 text-sm leading-6 text-gray-600 sm:pr-2 sm:text-base"
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
                className="mt-2 text-sm font-medium text-gray-500 underline decoration-gray-300 underline-offset-4 transition hover:text-gray-800"
              >
                View details
              </button>
            </div>

            <div className="mt-4 flex items-center justify-end gap-4 sm:justify-between">
              <p className="hidden text-2xl font-semibold tracking-tight text-gray-900 sm:block">£{price.toFixed(2)}</p>

              <button
                className="ml-auto inline-flex min-h-11 min-w-[8.75rem] items-center justify-center whitespace-nowrap rounded-xl bg-gray-800/90 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-80 sm:min-w-0 sm:w-fit sm:px-5 sm:text-base"
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Product details</p>
                <h3 className="mt-1 text-xl font-semibold text-gray-900">{name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-xl text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                aria-label="Close details"
              >
                ×
              </button>
            </div>

            <div className="max-h-[calc(90vh-150px)] overflow-y-auto px-5 py-5 sm:px-6">
              <div className="overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
                {hasImage ? (
                  <img
                    src={imageUrl!}
                    alt={name}
                    className="h-64 w-full object-cover object-center sm:h-72"
                  />
                ) : (
                  <div className="flex h-64 w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 sm:h-72">
                    <div className="mb-2 text-4xl">📦</div>
                    <p className="text-sm font-medium text-gray-600">Image coming soon</p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">Full product details</span>
                <span className="rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">£{price.toFixed(2)}</span>
              </div>

              <div className="mt-5 space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">Description</h4>
                <p className="text-base leading-7 text-gray-700">{fullDescription}</p>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm leading-6 text-gray-600">
                  This detail view is designed to support richer product information later, including fuller descriptions,
                  options, features, and other business-specific details.
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:text-base"
                >
                  Back to menu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    addToCart();
                    setDetailsOpen(false);
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gray-800/90 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-80 sm:text-base"
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
