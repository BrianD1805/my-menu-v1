"use client";

import { useEffect, useMemo, useState } from "react";
import { readCart, subscribeToCartUpdates } from "@/lib/cart";

type StoredCartItem = {
  productId: string;
  quantity: number;
};

type Props = {
  tenantSlug: string;
  href?: string;
};

function getItemCount(items: StoredCartItem[]) {
  return items.reduce((total, item) => total + Math.max(0, item.quantity || 0), 0);
}

export default function CartButton({ tenantSlug, href = "/checkout" }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = (items: StoredCartItem[]) => setCount(getItemCount(items));
    update(readCart<StoredCartItem>(tenantSlug));
    return subscribeToCartUpdates<StoredCartItem>(tenantSlug, update);
  }, [tenantSlug]);

  const badge = useMemo(() => (count > 99 ? "99+" : String(count)), [count]);

  return (
    <a
      href={href}
      className="inline-flex items-center gap-3 rounded-2xl bg-green-600 px-5 py-3 text-white shadow-sm transition hover:bg-green-700"
    >
      <span className="text-base font-semibold">Go to checkout</span>
      <span className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full bg-white/15 px-3 text-sm font-bold text-white">
        {badge}
      </span>
    </a>
  );
}
