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
      <div className="aspect-[4/3] w-full bg-gray-100">
        {hasImage ? (
          <img
            src={imageUrl!}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-6 text-center text-gray-500">
            <div className="mb-2 text-3xl">🍽️</div>
            <p className="text-sm font-medium text-gray-600">Image coming soon</p>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold">{name}</h3>
        {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
        <p className="mt-3 font-medium">£{price.toFixed(2)}</p>

        <button
          className="mt-4 rounded-xl bg-black px-4 py-2 text-white transition disabled:cursor-not-allowed disabled:opacity-80"
          onClick={addToCart}
          disabled={buttonState === "adding"}
        >
          {buttonState === "adding" ? "Adding..." : buttonState === "added" ? "1 added ✓" : "Add to order"}
        </button>
      </div>
    </div>
  );
}
