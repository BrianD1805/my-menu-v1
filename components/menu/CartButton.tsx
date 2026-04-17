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
      className="inline-flex h-11 min-w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3.5 text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50"
      aria-label={`Open cart with ${badge} item${count === 1 ? "" : "s"}`}
      title="Open cart"
    >
      <span className="relative inline-flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
          <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H7" />
        </svg>
        <span className="absolute -right-3 -top-3 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white shadow-sm">
          {badge}
        </span>
      </span>
    </a>
  );
}
