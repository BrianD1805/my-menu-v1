"use client";

import { useEffect, useMemo, useState } from "react";
import { clearCart, readCart, writeCart } from "@/lib/cart";
import { resolveTenantSlugFromHost } from "@/lib/tenant";

type CartItem = {
  productId: string;
  quantity: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
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

  const PAUSE_WHATSAPP_FOR_TESTING = true;

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
        whatsappPaused: PAUSE_WHATSAPP_FOR_TESTING
      });
      setLoading(false);

      if (!PAUSE_WHATSAPP_FOR_TESTING && data.whatsappUrl) {
        window.location.href = data.whatsappUrl;
      }
    } catch {
      setErrorMessage("Something went wrong while placing the order.");
      setLoading(false);
    }
  }

  if (successState) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl p-6">
        <div className="overflow-hidden rounded-[28px] border border-green-200 bg-white shadow-sm">
          <div className="border-b border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 sm:p-8">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
              ✓
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
              Order confirmed
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Thank you, {successState.customerName}.
            </h1>
            <p className="mt-3 max-w-2xl text-base text-gray-600">
              Your order has been saved successfully and your cart has been cleared, ready for a fresh order.
            </p>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1.15fr_0.85fr]">
            <section className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
                <div>
                  <p className="text-sm text-gray-500">Order reference</p>
                  <p className="font-semibold text-gray-900">{successState.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Order total</p>
                  <p className="text-xl font-bold text-gray-900">£{successState.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Order type</p>
                  <p className="font-medium capitalize text-gray-900">{successState.orderType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Items</p>
                  <p className="font-medium text-gray-900">{successState.itemCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{successState.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">
                    {successState.orderType === "collection"
                      ? "Collection order"
                      : successState.customerAddress || "No address supplied"}
                  </p>
                </div>
              </div>

              {successState.notes ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-500">Order notes</p>
                  <p className="mt-1 text-gray-900">{successState.notes}</p>
                </div>
              ) : null}
            </section>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <p className="font-semibold">What happens next?</p>
                <p className="mt-1 text-sm leading-6">
                  Your order is safely recorded and visible in Admin Orders.
                  {successState.whatsappPaused
                    ? " WhatsApp handoff is still paused for testing, so this order stops here for now."
                    : " WhatsApp handoff will continue automatically."}
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
                <button
                  onClick={() => {
                    resetCheckoutForNewOrder();
                    window.location.href = "/";
                  }}
                  className="w-full rounded-xl bg-black px-5 py-3 text-white"
                >
                  Back to menu
                </button>
                <button
                  onClick={() => resetCheckoutForNewOrder()}
                  className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-gray-900"
                >
                  Start a new order
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6">
      <h1 className="mb-2 text-3xl font-bold">Checkout</h1>
      <p className="mb-6 text-gray-600">
        Enter the customer details below, review the order, and confirm when ready.
      </p>

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <input
            className="w-full rounded-xl border p-3"
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <input
            className="w-full rounded-xl border p-3"
            placeholder="Phone number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />

          <input
            className="w-full rounded-xl border p-3"
            placeholder="Address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            disabled={orderType === "collection"}
          />

          <select
            className="w-full rounded-xl border p-3"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as "delivery" | "collection")}
          >
            <option value="delivery">Delivery</option>
            <option value="collection">Collection</option>
          </select>

          <textarea
            className="w-full rounded-xl border p-3"
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button
            onClick={() => void placeOrder()}
            disabled={loading || !cartRows.length}
            className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Placing order..." : "Confirm order"}
          </button>

          <p className="text-xs leading-5 text-gray-500">
            Your order will be saved first, and the cart will only clear after a successful save.
          </p>
        </div>

        <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Order summary</h2>

          {!cartRows.length ? (
            <p className="text-sm text-gray-600">Your cart is empty.</p>
          ) : (
            <div className="space-y-3">
              {cartRows.map((row) => (
                <div key={row.productId} className="rounded-xl border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-sm text-gray-600">£{row.unitPrice.toFixed(2)} each</p>
                    </div>
                    <p className="font-medium">£{row.lineTotal.toFixed(2)}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="rounded border px-3 py-1"
                      onClick={() => updateQuantity(row.productId, row.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{row.quantity}</span>
                    <button
                      className="rounded border px-3 py-1"
                      onClick={() => updateQuantity(row.productId, row.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t pt-4 font-semibold">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
