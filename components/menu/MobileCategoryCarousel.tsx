"use client";

import { useMemo, useRef, useState } from "react";
import ProductCard from "@/components/menu/ProductCard";
import type { MoneyFormatSettings } from "@/lib/money";

type ProductItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number | string;
};

export default function MobileCategoryCarousel({
  products,
  tenantSlug,
  moneySettings,
  accentColor,
}: {
  products: ProductItem[];
  tenantSlug: string;
  moneySettings: MoneyFormatSettings;
  accentColor?: string | null;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const startXRef = useRef<number | null>(null);
  const deltaXRef = useRef(0);

  const count = products.length;
  const activeProduct = products[activeIndex];

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < count - 1;

  function goTo(index: number) {
    const bounded = Math.max(0, Math.min(index, count - 1));
    setActiveIndex(bounded)
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    startXRef.current = event.touches[0]?.clientX ?? null;
    deltaXRef.current = 0;
  }

  function onTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (startXRef.current == null) return;
    deltaXRef.current = (event.touches[0]?.clientX ?? 0) - startXRef.current;
  }

  function onTouchEnd() {
    const delta = deltaXRef.current;
    startXRef.current = null;
    deltaXRef.current = 0;

    if (Math.abs(delta) < 42) return;
    if (delta < 0 && canGoNext) {
      goTo(activeIndex + 1);
    } else if (delta > 0 && canGoPrev) {
      goTo(activeIndex - 1);
    }
  }

  const counter = useMemo(() => `${activeIndex + 1} / ${count}`, [activeIndex, count]);

  if (!activeProduct) return null;

  return (
    <div className="sm:hidden">
      <div className="mb-3 flex items-center justify-between gap-3 px-[10px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Swipe for more
        </p>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          {counter}
        </p>
      </div>

      <div
        className="relative px-[10px]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="overflow-hidden rounded-[32px]">
          <div className="transition-transform duration-300 ease-out" style={{ transform: "translate3d(0,0,0)" }}>
            <ProductCard
              key={activeProduct.id}
              id={activeProduct.id}
              name={activeProduct.name}
              description={activeProduct.description}
              imageUrl={activeProduct.image_url}
              price={Number(activeProduct.price)}
              tenantSlug={tenantSlug}
              moneySettings={moneySettings}
              accentColor={accentColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
