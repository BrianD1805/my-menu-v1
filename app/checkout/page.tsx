"use client";

import { useEffect, useMemo, useState } from "react";
import { clearCart, readCart, writeCart } from "@/lib/cart";
import { resolveTenantSlugFromHost } from "@/lib/tenant";
import { DEFAULT_MONEY_SETTINGS, formatMoney, type MoneyFormatSettings } from "@/lib/money";

type CartItem = {
  productId: string;
  quantity: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
};

type TenantViewSettings = MoneyFormatSettings & {
  currencyCode?: string;
  currencySymbol?: string;
  currencyName?: string;
  displayName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactWhatsApp?: string;
  contactAddress?: string;
  footerBlurb?: string;
  footerNotice?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundTint?: string;
  borderColor?: string;
  textColor?: string;
};

type SuccessState = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  orderType: "delivery" | "collection";
  customerAddress: string;
  notes: string;
  total: number;
  itemCount: number;
  whatsappPaused: boolean;
  whatsappUrl: string | null;
  whatsappAppUrl: string | null;
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantResolved, setTenantResolved] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "collection">("delivery");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successState, setSuccessState] = useState<SuccessState | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantViewSettings>({ ...DEFAULT_MONEY_SETTINGS });

  useEffect(() => {
    const slug = resolveTenantSlugFromHost(window.location.host);
    setTenantSlug(slug);
    setTenantResolved(true);
  }, []);

  useEffect(() => {
    if (!tenantResolved || !tenantSlug) return;
    setItems(readCart<CartItem>(tenantSlug));
  }, [tenantResolved, tenantSlug]);

  useEffect(() => {
    async function loadProducts() {
      const res = await fetch(`/api/products?tenantSlug=${tenantSlug}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
        setTenantSettings({ ...DEFAULT_MONEY_SETTINGS, ...(data.settings || {}) });
      }
    }

    if (tenantResolved && tenantSlug) {
      void loadProducts();
    }
  }, [tenantResolved, tenantSlug]);

  const cartRows = useMemo(() => {
    return items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;

        const lineTotal = product.price * item.quantity;

        return {
          ...item,
          name: product.name,
          unitPrice: product.price,
          lineTotal
        };
      })
      .filter(Boolean) as Array<{
      productId: string;
      quantity: number;
      name: string;
      unitPrice: number;
      lineTotal: number;
    }>;
  }, [items, products]);

  const total = useMemo(
    () => cartRows.reduce((sum, row) => sum + row.lineTotal, 0),
    [cartRows]
  );

  const checkoutPrimary = tenantSettings.primaryColor || "#7B1E22";
  const checkoutAccent = tenantSettings.accentColor || "#C7922F";
  const checkoutBackground = tenantSettings.backgroundTint || "#F8F4F0";
  const checkoutBorder = tenantSettings.borderColor || "#D9C7A3";
  const checkoutText = tenantSettings.textColor || "#2B2B2B";

  function attemptWhatsAppHandoff(webUrl: string | null, appUrl: string | null) {
    const fallbackUrl = webUrl?.trim() || null;
    const appFirstUrl = appUrl?.trim() || fallbackUrl;
    if (!appFirstUrl) return;

    let fallbackTimer: number | null = null;
    const clearFallback = () => {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        clearFallback();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange, { once: true });

    if (fallbackUrl && appFirstUrl !== fallbackUrl) {
      fallbackTimer = window.setTimeout(() => {
        window.location.href = fallbackUrl;
      }, 1200);
    }

    window.location.href = appFirstUrl;
  }


  function updateQuantity(productId: string, nextQuantity: number) {
    const nextItems =
      nextQuantity <= 0
        ? items.filter((x) => x.productId !== productId)
        : items.map((x) =>
            x.productId === productId ? { ...x, quantity: nextQuantity } : x
          );

    setItems(nextItems);
    writeCart(tenantSlug, nextItems);
  }

  function resetCheckoutForNewOrder() {
    setSuccessState(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setNotes("");
    setOrderType("delivery");
    setErrorMessage("");
  }

  const PAUSE_WHATSAPP_FOR_TESTING = false;

  async function placeOrder() {
    setErrorMessage("");

    if (!customerName.trim()) {
      setErrorMessage("Please enter customer name.");
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage("Please enter phone number.");
      return;
    }

    if (!items.length) {
      setErrorMessage("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tenantSlug,
          customerName,
          customerPhone,
          customerAddress,
          orderType,
          notes,
          items
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to place order.");
        setLoading(false);
        return;
      }

      clearCart(tenantSlug);
      setItems([]);
      setSuccessState({
        orderId: data.orderId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderType,
        customerAddress: customerAddress.trim(),
        notes: notes.trim(),
        total,
        itemCount: cartRows.reduce((sum, row) => sum + row.quantity, 0),
        whatsappPaused: PAUSE_WHATSAPP_FOR_TESTING,
        whatsappUrl: data.whatsappUrl || null,
        whatsappAppUrl: data.whatsappAppUrl || null
      });
      setLoading(false);

      if (!PAUSE_WHATSAPP_FOR_TESTING && (data.whatsappAppUrl || data.whatsappUrl)) {
        window.setTimeout(() => {
          attemptWhatsAppHandoff(data.whatsappUrl || null, data.whatsappAppUrl || null);
        }, 150);
      }
    } catch {
      setErrorMessage("Something went wrong while placing the order.");
      setLoading(false);
    }
  }

  if (successState) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center p-4 sm:p-6" style={{ backgroundColor: checkoutBackground }}>
        <div className="w-full overflow-hidden rounded-[32px] border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]" style={{ borderColor: checkoutBorder }}>
          <div className="relative overflow-hidden px-6 py-8 text-white sm:px-8 sm:py-10" style={{ background: `linear-gradient(135deg, ${checkoutPrimary} 0%, color-mix(in srgb, ${checkoutPrimary} 78%, ${checkoutAccent}) 100%)` }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_24%)]" />
            <div className="relative">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/18 text-3xl ring-1 ring-white/30 backdrop-blur-sm">
                ✓
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                Order confirmed
              </p>
              <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Thanks, {successState.customerName}. Your order is in.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
                We’ve saved your order successfully and cleared your cart, so you’re ready whenever you’d like to place another one.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-full bg-white/14 px-4 py-2 text-sm font-medium ring-1 ring-white/20 backdrop-blur-sm">
                  Ref: <span className="font-semibold">{successState.orderId}</span>
                </div>
                <div className="rounded-full bg-white/14 px-4 py-2 text-sm font-medium ring-1 ring-white/20 backdrop-blur-sm">
                  Total: <span className="font-semibold">{formatMoney(successState.total, tenantSettings)}</span>
                </div>
                <div className="rounded-full bg-white/14 px-4 py-2 text-sm font-medium ring-1 ring-white/20 backdrop-blur-sm">
                  {successState.itemCount} item{successState.itemCount === 1 ? "" : "s"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border bg-white p-4" style={{ borderColor: checkoutBorder, backgroundColor: checkoutBackground }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Order type</p>
                  <p className="mt-2 text-base font-semibold capitalize text-gray-900">{successState.orderType}</p>
                </div>
                <div className="rounded-2xl border bg-white p-4" style={{ borderColor: checkoutBorder, backgroundColor: checkoutBackground }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Phone</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">{successState.customerPhone}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2 xl:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{successState.orderType === "collection" ? "Collection" : "Delivery address"}</p>
                  <p className="mt-2 text-base font-semibold text-gray-900">
                    {successState.orderType === "collection"
                      ? "Collection order confirmed"
                      : successState.customerAddress || "No address supplied"}
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border bg-white p-5 shadow-sm" style={{ borderColor: checkoutBorder }}>
                <div className="mb-4 flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">What happens next</p>
                    <p className="mt-1 text-sm text-gray-600">A simple confirmation so the customer knows the order is safely through.</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ backgroundColor: checkoutBackground, color: checkoutPrimary }}>
                    Saved
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: checkoutBackground, color: checkoutPrimary }}>1</div>
                    <div>
                      <p className="font-medium text-gray-900">Your order has been received</p>
                      <p className="text-sm leading-6 text-gray-600">It has been saved successfully and is ready for the restaurant to review.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: checkoutBackground, color: checkoutPrimary }}>2</div>
                    <div>
                      <p className="font-medium text-gray-900">Your cart is now empty</p>
                      <p className="text-sm leading-6 text-gray-600">That keeps your next order clean and avoids old items carrying over.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">3</div>
                    <div>
                      <p className="font-medium text-gray-900">You can head back to the menu any time</p>
                      <p className="text-sm leading-6 text-gray-600">
                        {successState.whatsappPaused
                          ? "WhatsApp handoff is still paused for now, so this confirmation page is the final step in the customer flow."
                          : "We’re opening WhatsApp now. If it does not open automatically, use the button below."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {successState.notes ? (
                <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Order notes</p>
                  <p className="mt-3 text-sm leading-6 text-gray-700">{successState.notes}</p>
                </div>
              ) : null}
            </section>

            <aside className="space-y-4">
              <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-5 text-emerald-950">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Order summary</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-emerald-800/80">Reference</span>
                    <span className="font-semibold">{successState.orderId}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-emerald-800/80">Items</span>
                    <span className="font-semibold">{successState.itemCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-emerald-800/80">Total</span>
                    <span className="text-lg font-bold">{formatMoney(successState.total, tenantSettings)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm">
                <div className="space-y-3">
                  {!successState.whatsappPaused && (successState.whatsappAppUrl || successState.whatsappUrl) ? (
                    <button
                      onClick={() => attemptWhatsAppHandoff(successState.whatsappUrl, successState.whatsappAppUrl)}
                      className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition"
                      style={{ backgroundColor: checkoutPrimary }}
                    >
                      Open WhatsApp
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      resetCheckoutForNewOrder();
                      window.location.href = "/";
                    }}
                    className="w-full rounded-2xl bg-gray-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-black"
                  >
                    Back to menu
                  </button>
                  <button
                    onClick={() => resetCheckoutForNewOrder()}
                    className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                  >
                    Start a new order
                  </button>
                </div>
              </div>
            </aside>
          </div>
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 text-sm text-slate-600 sm:px-8">
            <p className="font-semibold text-slate-900">{tenantSettings.displayName || "Business details"}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
              {tenantSettings.contactPhone ? <span>Phone: {tenantSettings.contactPhone}</span> : null}
              {tenantSettings.contactEmail ? <span>Email: {tenantSettings.contactEmail}</span> : null}
              {tenantSettings.contactAddress ? <span>Address: {tenantSettings.contactAddress}</span> : null}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">{tenantSettings.footerNotice || "Prices and availability may change without notice."}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6" style={{ backgroundColor: checkoutBackground }}>
      <h1 className="mb-2 text-3xl font-bold" style={{ color: checkoutPrimary }}>Checkout</h1>
      <p className="mb-6" style={{ color: checkoutText }}>
        Enter the customer details below, review the order, and confirm when ready.
      </p>

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: checkoutBorder }}>
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <input
            className="w-full rounded-xl border p-3" style={{ borderColor: checkoutBorder, color: checkoutText, backgroundColor: "white" }}
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <input
            className="w-full rounded-xl border p-3" style={{ borderColor: checkoutBorder, color: checkoutText, backgroundColor: "white" }}
            placeholder="Phone number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />

          <input
            className="w-full rounded-xl border p-3" style={{ borderColor: checkoutBorder, color: checkoutText, backgroundColor: "white" }}
            placeholder="Address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            disabled={orderType === "collection"}
          />

          <select
            className="w-full rounded-xl border p-3" style={{ borderColor: checkoutBorder, color: checkoutText, backgroundColor: "white" }}
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as "delivery" | "collection")}
          >
            <option value="delivery">Delivery</option>
            <option value="collection">Collection</option>
          </select>

          <textarea
            className="w-full rounded-xl border p-3" style={{ borderColor: checkoutBorder, color: checkoutText, backgroundColor: "white" }}
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            onClick={() => void placeOrder()}
            disabled={loading || !cartRows.length}
            className="rounded-xl px-5 py-3 text-white disabled:opacity-50" style={{ backgroundColor: checkoutPrimary }}
          >
            {loading ? "Placing order..." : "Confirm order"}
          </button>

          <p className="text-xs leading-5 text-gray-500">
            Your order will be saved first, and the cart will only clear after a successful save.
          </p>
        </div>

        <aside className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: checkoutBorder }}>
          <h2 className="mb-4 text-xl font-semibold" style={{ color: checkoutPrimary }}>Order summary</h2>

          {!cartRows.length ? (
            <p className="text-sm text-gray-600">Your cart is empty.</p>
          ) : (
            <div className="space-y-3">
              {cartRows.map((row) => (
                <div key={row.productId} className="rounded-xl border p-3" style={{ borderColor: checkoutBorder }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-sm text-gray-600">{formatMoney(row.unitPrice, tenantSettings)} each</p>
                    </div>
                    <p className="font-medium">{formatMoney(row.lineTotal, tenantSettings)}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="rounded border px-3 py-1" style={{ borderColor: checkoutBorder }}
                      onClick={() => updateQuantity(row.productId, row.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{row.quantity}</span>
                    <button
                      className="rounded border px-3 py-1" style={{ borderColor: checkoutBorder }}
                      onClick={() => updateQuantity(row.productId, row.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t pt-4 font-semibold">
                <span>Total</span>
                <span>{formatMoney(total, tenantSettings)}</span>
              </div>
            </div>
          )}
        </aside>
      </div>

      <section className="mt-6 rounded-[28px] border bg-white p-5 text-sm shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-6" style={{ borderColor: checkoutBorder, color: checkoutText }}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: checkoutAccent }}>Business details</p>
        <p className="mt-2 text-base font-semibold" style={{ color: checkoutPrimary }}>{tenantSettings.displayName || "Your order"}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {tenantSettings.contactPhone ? <p>Phone: {tenantSettings.contactPhone}</p> : null}
          {tenantSettings.contactEmail ? <p>Email: {tenantSettings.contactEmail}</p> : null}
          {tenantSettings.contactWhatsApp ? <p>WhatsApp: {tenantSettings.contactWhatsApp}</p> : null}
          {tenantSettings.contactAddress ? <p>Address: {tenantSettings.contactAddress}</p> : null}
        </div>
        <p className="mt-4 leading-6 text-slate-600">{tenantSettings.footerBlurb || "Thank you for ordering with us."}</p>
        <p className="mt-3 text-xs leading-5 text-slate-500">{tenantSettings.footerNotice || "Prices and availability may change without notice."}</p>
      </section>
    </main>
  );
}