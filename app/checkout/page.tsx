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

  const PAUSE_WHATSAPP_FOR_TESTING = true;

  async function placeOrder() {
    if (!customerName.trim()) {
      window.alert("Please enter customer name");
      return;
    }

    if (!customerPhone.trim()) {
      window.alert("Please enter phone number");
      return;
    }

    if (!items.length) {
      window.alert("Your cart is empty");
      return;
    }

    setLoading(true);

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
      window.alert(data.error || "Failed to place order");
      setLoading(false);
      return;
    }

    clearCart(tenantSlug);
    setItems([]);

    if (PAUSE_WHATSAPP_FOR_TESTING) {
      setLoading(false);
      window.alert(`Order created successfully. WhatsApp handoff is temporarily paused for testing. Order ID: ${data.orderId}`);
      return;
    }

    if (data.whatsappUrl) {
      window.location.href = data.whatsappUrl;
      return;
    }

    window.alert(`Order placed: ${data.orderId}`);
    window.location.href = "/";
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

      <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
            {loading ? "Placing order..." : "Create order (WhatsApp paused)"}
          </button>
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
