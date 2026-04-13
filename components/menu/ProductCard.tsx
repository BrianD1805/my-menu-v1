"use client";

import { useEffect, useState } from "react";
import { readCart, writeCart } from "@/lib/cart";

type Props = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  tenantSlug: string;
};

type StoredCartItem = {
  productId: string;
  quantity: number;
};

export default function ProductCard({ id, name, description, price, tenantSlug }: Props) {
  const [buttonState, setButtonState] = useState<"idle" | "adding" | "added">("idle");

  useEffect(() => {
    if (buttonState === "idle") return;

    const timeout = window.setTimeout(() => {
      setButtonState(buttonState === "adding" ? "added" : "idle");
    }, buttonState === "adding" ? 350 : 1200);

    return () => window.clearTimeout(timeout);
  }, [buttonState]);

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
  }

  const buttonLabel =
    buttonState === "adding"
      ? "Adding..."
      : buttonState === "added"
        ? "1 added ✓"
        : "Add to order";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{name}</h3>
      {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      <p className="mt-3 font-medium">£{price.toFixed(2)}</p>

      <button
        className="mt-4 min-w-[132px] rounded-xl bg-black px-4 py-2 text-white transition hover:opacity-90 disabled:cursor-default disabled:opacity-100"
        onClick={addToCart}
        disabled={buttonState === "adding"}
        aria-live="polite"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
