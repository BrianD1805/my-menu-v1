"use client";

import { useState } from "react";
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
  const hasImage = typeof imageUrl === "string" && imageUrl.trim().length > 0;

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

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-stretch gap-0">
        <div className="w-36 shrink-0 p-3 sm:w-40">
          <div className="aspect-square overflow-hidden rounded-xl bg-gray-100">
            {hasImage ? (
              <img
                src={imageUrl!}
                alt={name}
                className="h-full w-full object-cover object-center"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-3 text-center text-gray-500">
                <div className="mb-1 text-2xl">🍽️</div>
                <p className="text-xs font-medium text-gray-600">Image coming soon</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div>
            <h3 className="text-lg font-semibold leading-tight">{name}</h3>
            {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
            <p className="mt-3 font-medium">£{price.toFixed(2)}</p>
          </div>

          <button
            className="mt-4 w-fit rounded-xl bg-black px-4 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-80"
            onClick={addToCart}
            disabled={buttonState === "adding"}
          >
            {buttonState === "adding" ? "Adding..." : buttonState === "added" ? "1 added ✓" : "Add to order"}
          </button>
        </div>
      </div>
    </div>
  );
}
