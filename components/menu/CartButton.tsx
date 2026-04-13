"use client";

import { useEffect, useMemo, useState } from "react";
import { readCart, subscribeToCartUpdates } from "@/lib/cart";

type CartItem = {
  productId: string;
  quantity: number;
};

type Props = {
  tenantSlug: string;
};

export default function CartButton({ tenantSlug }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refreshCount = () => {
      const items = readCart<CartItem>(tenantSlug);
      setCount(items.reduce((sum, item) => sum + item.quantity, 0));
    };

    refreshCount();
    return subscribeToCartUpdates(tenantSlug, refreshCount);
  }, [tenantSlug]);

  const label = useMemo(() => {
    if (count === 0) return "Go to checkout";
    return `Go to checkout (${count})`;
  }, [count]);

  return (
    <a href="/checkout" className="inline-flex items-center gap-3 rounded-xl bg-green-600 px-5 py-3 text-white">
      <span>{label}</span>
      <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-white/20 px-2 py-1 text-sm font-semibold text-white">
        {count}
      </span>
    </a>
  );
}
