"use client";

import { useState } from "react";
import { StoredCartItem, readCart, writeCart } from "@/lib/cart";
import { buildMoneySettings, formatMoney, type MoneyFormatSettings } from "@/lib/money";

type Props = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  tenantSlug: string;
  moneySettings?: MoneyFormatSettings;
  accentColor?: string | null;
};

function stripHtml(value: string | null | undefined) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ProductCard({ id, name, description, imageUrl, price, tenantSlug, moneySettings, accentColor }: Props) {
  const [buttonState, setButtonState] = useState<"idle" | "adding" | "added">("idle");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const money = buildMoneySettings(moneySettings);
  const fullPrice = formatMoney(price, money);
  const brandAccent = accentColor || "#336699";
  const cleanDescription = stripHtml(description) || "Freshly prepared and ready to order.";

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
    window.setTimeout(() => setButtonState("idle"), 1200);
  }

  function buttonLabel() {
    if (buttonState === "adding") return "Adding";
    if (buttonState === "added") return "Added ✓";
    return "Add";
  }

  return (
    <>
      <article className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-[0_10px_22px_rgba(16,24,40,0.07)]">
        <div className="grid min-h-[220px] grid-cols-[220px_1fr] max-[680px]:min-h-[168px] max-[680px]:grid-cols-[132px_1fr]">
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="relative h-full border-r border-slate-200 bg-[linear-gradient(135deg,rgba(51,102,153,0.10),rgba(51,102,153,0.03))] text-left"
            aria-label={`View details for ${name}`}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="h-full w-full object-contain p-4 max-[680px]:p-3"
                loading="lazy"
              />
            ) : (
              <div className="grid h-full place-items-center px-3 text-center text-sm font-bold tracking-[0.02em] text-slate-500 max-[680px]:text-[0.86rem]">
                Product Image
              </div>
            )}
          </button>

          <div className="grid content-between gap-[14px] p-[18px] max-[680px]:gap-[10px] max-[680px]:p-[14px]">
            <div>
              <p className="mb-[6px] text-[0.76rem] font-bold uppercase tracking-[0.08em] text-slate-500">Oblong layout</p>
              <button type="button" onClick={() => setDetailsOpen(true)} className="text-left">
                <h3 className="m-0 text-[1.08rem] font-bold leading-[1.24] text-slate-800 max-[680px]:text-[0.98rem]">{name}</h3>
              </button>
              <p className="mt-[8px] max-w-[46ch] text-[0.95rem] leading-[1.5] text-slate-500 max-[680px]:text-[0.9rem]">
                {cleanDescription}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 max-[680px]:flex-col max-[680px]:items-stretch">
              <div className="whitespace-nowrap text-[1.18rem] font-extrabold text-slate-800 max-[680px]:w-full">{fullPrice}</div>

              <div className="flex flex-wrap gap-[10px] max-[680px]:grid max-[680px]:grid-cols-2 max-[680px]:w-full">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="min-h-[42px] rounded-[12px] border border-slate-200 bg-slate-50 px-[14px] py-[10px] text-[0.92rem] font-bold text-slate-800 transition hover:bg-slate-100 max-[680px]:w-full"
                >
                  More Info
                </button>
                <button
                  type="button"
                  onClick={() => void addToCart()}
                  disabled={buttonState === "adding"}
                  className="min-h-[42px] rounded-[12px] border px-[14px] py-[10px] text-[0.92rem] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-80 max-[680px]:w-full"
                  style={{ backgroundColor: brandAccent, borderColor: brandAccent }}
                >
                  {buttonLabel()}
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {detailsOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4" onClick={() => setDetailsOpen(false)}>
          <div
            className="w-full max-w-[760px] overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.22)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Product details</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-5 px-5 py-5 sm:px-6 sm:py-6 md:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                {imageUrl ? (
                  <img src={imageUrl} alt={name} className="h-full w-full object-contain p-4" loading="lazy" />
                ) : (
                  <div className="grid aspect-square place-items-center px-4 text-center text-sm font-semibold text-slate-500">Product image</div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="text-[1.18rem] font-extrabold text-slate-900">{fullPrice}</div>
                <p className="text-sm leading-7 text-slate-600">{cleanDescription}</p>
                <div>
                  <button
                    type="button"
                    onClick={() => void addToCart()}
                    disabled={buttonState === "adding"}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border px-4 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-80"
                    style={{ backgroundColor: brandAccent, borderColor: brandAccent }}
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
