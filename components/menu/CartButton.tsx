"use client";

import { forwardRef, useEffect, useMemo, useState } from "react";
import { readCart, subscribeToCartUpdates } from "@/lib/cart";

type StoredCartItem = {
  productId: string;
  quantity: number;
};

type Props = {
  tenantSlug: string;
  href?: string;
  accentColor?: string | null;
  primaryColor?: string | null;
  pulseKey?: number;
};

function getItemCount(items: StoredCartItem[]) {
  return items.reduce((total, item) => total + Math.max(0, item.quantity || 0), 0);
}

const CartButton = forwardRef<HTMLAnchorElement, Props>(function CartButton(
  { tenantSlug, href = "/checkout", accentColor, primaryColor, pulseKey = 0 },
  ref,
) {
  const [count, setCount] = useState(0);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    const update = (items: StoredCartItem[]) => setCount(getItemCount(items));
    update(readCart<StoredCartItem>(tenantSlug));
    return subscribeToCartUpdates<StoredCartItem>(tenantSlug, update);
  }, [tenantSlug]);

  useEffect(() => {
    if (!pulseKey) return;
    setIsPulsing(true);
    const timer = window.setTimeout(() => setIsPulsing(false), 650);
    return () => window.clearTimeout(timer);
  }, [pulseKey]);

  const badge = useMemo(() => (count > 99 ? "99+" : String(count)), [count]);
  const brandAccent = accentColor || "#C7922F";
  const brandPrimary = primaryColor || "#7B1E22";

  return (
    <a
      ref={ref}
      href={href}
      className="relative inline-flex h-11 min-w-11 items-center justify-center overflow-visible rounded-2xl border bg-white/95 px-3 text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.07)] transition hover:-translate-y-[1px] hover:bg-white"
      style={{
        borderColor: `color-mix(in srgb, ${brandAccent} 30%, white)`,
        animation: isPulsing ? "orduva-cart-pop 620ms cubic-bezier(0.22,1,0.36,1)" : undefined,
        boxShadow: isPulsing
          ? `0 16px 34px color-mix(in srgb, ${brandPrimary} 26%, rgba(15,23,42,0.16))`
          : "0 10px 24px rgba(15,23,42,0.07)",
      }}
      aria-label={`Open cart with ${badge} item${count === 1 ? "" : "s"}`}
      title="Open cart"
    >
      {isPulsing ? (
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            border: `1px solid color-mix(in srgb, ${brandAccent} 55%, white)`,
            animation: "orduva-cart-ring 620ms ease-out",
          }}
          aria-hidden="true"
        />
      ) : null}

      <span className="relative inline-flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="20" r="1" />
          <circle cx="18" cy="20" r="1" />
          <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 7H7" />
        </svg>
        <span className="absolute -right-3 -top-3 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: brandPrimary }}>
          {badge}
        </span>
      </span>
    </a>
  );
});

export default CartButton;
