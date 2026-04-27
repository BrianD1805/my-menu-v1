"use client";

import { useEffect, useMemo, useState } from "react";
import { clearCart, readCart, writeCart } from "@/lib/cart";
import { resolveTenantSlugFromHost } from "@/lib/tenant";
import { DEFAULT_MONEY_SETTINGS, formatMoney, type MoneyFormatSettings } from "@/lib/money";
import CustomerPushNotificationsCard from "@/components/checkout/CustomerPushNotificationsCard";

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
  tenantSlug: string;
  whatsappPaused: boolean;
  whatsappUrl: string | null;
  whatsappAppUrl: string | null;
};

type CustomerAccount = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
};

function buildSavedAddress(customer: CustomerAccount | null) {
  if (!customer) return "";
  return [customer.addressLine1, customer.addressLine2, customer.city, customer.postcode]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tenantSlug, setTenantSlug] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [tenantResolved, setTenantResolved] = useState(false);
  const [customerAccount, setCustomerAccount] = useState<CustomerAccount | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "collection">("delivery");
  const [saveDetailsToAccount, setSaveDetailsToAccount] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successState, setSuccessState] = useState<SuccessState | null>(null);
  const [tenantSettings, setTenantSettings] = useState<TenantViewSettings>({ ...DEFAULT_MONEY_SETTINGS });

  useEffect(() => {
    async function loadCustomerAccount() {
      try {
        const res = await fetch("/api/customer/auth/me", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.customer) {
          setCustomerAccount(data.customer);
          if (data.customer.fullName) {
            setCustomerName((current) => current || data.customer.fullName);
          }
          if (data.customer.phone) {
            setCustomerPhone((current) => current || data.customer.phone);
          }
          const savedAddress = buildSavedAddress(data.customer);
          if (savedAddress) {
            setCustomerAddress((current) => current || savedAddress);
          }
        } else {
          setCustomerAccount(null);
        }
      } catch {
        setCustomerAccount(null);
      }
    }

    void loadCustomerAccount();
  }, []);

useEffect(() => {
    try {
      const savedSlug = window.localStorage.getItem("orduva_active_tenant_slug") || "";
      const savedTenantId = window.localStorage.getItem("orduva_active_tenant_id") || "";
      const fallbackSlug = resolveTenantSlugFromHost(window.location.host);

      setTenantSlug(savedSlug || fallbackSlug);
      setTenantId(savedTenantId || "");
    } finally {
      setTenantResolved(true);
    }
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

  function applySavedProfileToCheckout(customer = customerAccount) {
    if (!customer) return;
    setCustomerName(customer.fullName || "");
    setCustomerPhone(customer.phone || "");
    setCustomerAddress(buildSavedAddress(customer));
  }

  function resetCheckoutForNewOrder() {
    setSuccessState(null);
    if (customerAccount) {
      applySavedProfileToCheckout(customerAccount);
    } else {
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
    }
    setNotes("");
    setOrderType("delivery");
    setErrorMessage("");
  }

  const PAUSE_WHATSAPP_FOR_TESTING = true;

  async function saveCheckoutDetailsToProfile() {
    if (!customerAccount || !saveDetailsToAccount) return;

    const payload: Record<string, string> = {
      fullName: customerName,
      phone: customerPhone,
    };
    const savedAddress = buildSavedAddress(customerAccount);
    if (customerAddress.trim() !== savedAddress) {
      payload.checkoutAddress = customerAddress;
    }

    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.customer) {
      setCustomerAccount(data.customer);
    }
  }

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
        customerAccountId: customerAccount?.id || null,
          tenantSlug,
          tenantId,
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

      await saveCheckoutDetailsToProfile();

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
        tenantSlug,
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
      <main className="min-h-screen w-full px-4 py-6 sm:px-6 sm:py-8" style={{ backgroundColor: checkoutBackground }}>
        <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[32px] border bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]" style={{ borderColor: checkoutBorder }}>
          <section className="relative overflow-hidden px-6 py-8 text-white sm:px-8 sm:py-10" style={{ background: `linear-gradient(135deg, ${checkoutPrimary} 0%, color-mix(in srgb, ${checkoutPrimary} 78%, ${checkoutAccent}) 100%)` }}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_24%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/18 text-3xl ring-1 ring-white/30 backdrop-blur-sm">
                  ✓
                </div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">Order confirmed</p>
                <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                  Thanks, {successState.customerName}. Your order is in.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
                  We’ve received your order and sent it through to the team.
                </p>
              </div>

              <div className="rounded-[26px] bg-white/14 p-4 text-sm ring-1 ring-white/20 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/75">Total</span>
                  <span className="text-lg font-bold">{formatMoney(successState.total, tenantSettings)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/15 pt-3">
                  <span className="text-white/75">Items</span>
                  <span className="font-semibold">{successState.itemCount}</span>
                </div>
                <div className="mt-3 border-t border-white/15 pt-3">
                  <p className="text-white/75">Reference</p>
                  <p className="mt-1 break-all font-semibold">{successState.orderId}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <CustomerPushNotificationsCard
                tenantSlug={successState.tenantSlug}
                orderId={successState.orderId}
                customerPhone={successState.customerPhone}
                customerName={successState.customerName}
                customerAccountId={customerAccount?.id || null}
              />

              <div className="rounded-[28px] border bg-white p-5 shadow-sm" style={{ borderColor: checkoutBorder }}>
                <p className="text-sm font-semibold text-gray-950">What happens next</p>
                <div className="mt-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: checkoutBackground, color: checkoutPrimary }}>1</div>
                    <div>
                      <p className="font-medium text-gray-900">The team reviews your order</p>
                      <p className="text-sm leading-6 text-gray-600">You’ll be updated when it is accepted and being prepared.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: checkoutBackground, color: checkoutPrimary }}>2</div>
                    <div>
                      <p className="font-medium text-gray-900">Keep this page or your phone nearby</p>
                      <p className="text-sm leading-6 text-gray-600">If you enable updates, this device can receive order status notifications.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: checkoutBackground, color: checkoutPrimary }}>3</div>
                    <div>
                      <p className="font-medium text-gray-900">Come back to the menu any time</p>
                      <p className="text-sm leading-6 text-gray-600">Your cart has been cleared so your next order starts fresh.</p>
                    </div>
                  </div>
                </div>
              </div>

              {successState.notes ? (
                <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Your order notes</p>
                  <p className="mt-3 text-sm leading-6 text-gray-700">{successState.notes}</p>
                </div>
              ) : null}
            </div>

            <aside className="space-y-5">
              <div className="rounded-[28px] border bg-white p-5 shadow-sm" style={{ borderColor: checkoutBorder }}>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Order details</p>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <p className="text-gray-500">Order type</p>
                    <p className="mt-1 font-semibold capitalize text-gray-950">{successState.orderType}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="mt-1 font-semibold text-gray-950">{successState.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">{successState.orderType === "collection" ? "Collection" : "Delivery address"}</p>
                    <p className="mt-1 leading-6 font-semibold text-gray-950">
                      {successState.orderType === "collection" ? "Collection order" : successState.customerAddress || "No address supplied"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm">
                <div className="space-y-3">
                  {successState.whatsappAppUrl || successState.whatsappUrl ? (
                    <button
                      onClick={() => attemptWhatsAppHandoff(successState.whatsappUrl, successState.whatsappAppUrl)}
                      className="w-full rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition"
                      style={{ backgroundColor: checkoutPrimary }}
                    >
                      Send on WhatsApp
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
                    Start another order
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{tenantSettings.displayName || "Business details"}</p>
                <div className="mt-2 space-y-1">
                  {tenantSettings.contactPhone ? <p>Phone: {tenantSettings.contactPhone}</p> : null}
                  {tenantSettings.contactEmail ? <p>Email: {tenantSettings.contactEmail}</p> : null}
                  {tenantSettings.contactAddress ? <p>Address: {tenantSettings.contactAddress}</p> : null}
                </div>
              </div>
            </aside>
          </section>
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
          {customerAccount ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Signed in as {customerAccount.fullName || customerAccount.email}</p>
                  <p className="mt-1 text-emerald-800">Saved profile details have been prefilled where available, and this order will be linked to your account.</p>
                </div>
                <button
                  type="button"
                  onClick={() => applySavedProfileToCheckout()}
                  className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
                >
                  Use saved details
                </button>
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-emerald-900">
                <input
                  type="checkbox"
                  checked={saveDetailsToAccount}
                  onChange={(event) => setSaveDetailsToAccount(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-emerald-300"
                />
                <span>Save these checkout details to my account for next time</span>
              </label>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Guest checkout</p>
              <p className="mt-1 text-slate-600">You can still order as a guest, or <a href="/account/login" className="font-semibold underline">sign in</a> to link your order to your account and prefill your details next time.</p>
            </div>
          )}
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