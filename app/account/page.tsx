"use client";

import { useEffect, useState } from "react";

type AccountOrder = {
  id: string;
  createdAt: string;
  total: number;
  subtotal?: number;
  status: string;
  orderType: string | null;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  address: string | null;
  paymentMethodLabel?: string | null;
  paymentStatus?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;
  rewardTier?: string | null;
  rewardDiscountAmount?: number;
  discountCode?: string | null;
  discountName?: string | null;
  discountAmount?: number;
  receiptNumber?: string | null;
  receiptDownloadCount?: number;
  receiptUrl?: string;
  itemsSummary: string[];
};

type Customer = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  postcode?: string | null;
};

function CustomerDataLoading({ title, message }: { title: string; message: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-8 sm:px-5 lg:px-6">
      <section className="w-full rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Customer account</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
      </section>
    </main>
  );
}

function buildSavedAddress(customer: Customer | null) {
  if (!customer) return "";
  return [customer.addressLine1, customer.addressLine2, customer.city, customer.postcode]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(", ");
}

export default function CustomerAccountPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    async function loadProfileFirst() {
      const profileStartedAt = performance.now();
      try {
        const meRes = await fetch("/api/customer/auth/me", { cache: "no-store" });
        const meData = await meRes.json().catch(() => ({}));

        if (meRes.ok && meData?.customer) {
          setCustomer(meData.customer);
        } else {
          setCustomer(null);
        }
      } catch {
        setCustomer(null);
      } finally {
        setLoading(false);
        console.info(`[Orduva load] account profile: ${Math.round(performance.now() - profileStartedAt)}ms`);
      }
    }
    void loadProfileFirst();
  }, []);

  useEffect(() => {
    if (!customer?.id) return;

    async function loadOrdersAfterProfile() {
      setOrdersLoading(true);
      const ordersStartedAt = performance.now();
      try {
        const ordersRes = await fetch("/api/customer/orders", { cache: "no-store" });
        const ordersData = await ordersRes.json().catch(() => ({}));
        if (ordersRes.ok && Array.isArray(ordersData?.orders)) setOrders(ordersData.orders);
      } finally {
        setOrdersLoading(false);
        console.info(`[Orduva load] account orders: ${Math.round(performance.now() - ordersStartedAt)}ms`);
      }
    }

    void loadOrdersAfterProfile();
  }, [customer?.id]);


  async function handleShareReceipt(order: AccountOrder) {
    if (!order.receiptUrl || typeof window === "undefined") return;

    const receiptUrl = new URL(order.receiptUrl, window.location.origin).toString();
    const title = `Receipt ${order.receiptNumber || order.id.slice(0, 8).toUpperCase()}`;
    const text = `Your receipt for order ${order.id.slice(0, 8).toUpperCase()}.`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: receiptUrl });
        return;
      }

      await navigator.clipboard?.writeText(receiptUrl);
      setMessage("Receipt link copied. You can now paste it into a message.");
    } catch {
      try {
        await navigator.clipboard?.writeText(receiptUrl);
        setMessage("Receipt link copied. You can now paste it into a message.");
      } catch {
        setMessage("Receipt link could not be shared automatically. Open the receipt and copy the page link.");
      }
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = {
      fullName: String(form.get("fullName") || ""),
      phone: String(form.get("phone") || ""),
      addressLine1: String(form.get("addressLine1") || ""),
      addressLine2: String(form.get("addressLine2") || ""),
      city: String(form.get("city") || ""),
      postcode: String(form.get("postcode") || ""),
    };

    const res = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error || "Could not save profile.");
      setSaving(false);
      return;
    }

    setCustomer(data.customer);
    setSaving(false);
    setEditorOpen(false);
    setMessage("Profile saved.");
  }

  if (loading) {
    return <CustomerDataLoading title="Getting your account ready…" message="We are opening your saved profile details." />;
  }

  if (!customer) {
    if (typeof window !== "undefined") window.location.href = "/account/login";
    return <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-5 lg:px-6">Redirecting…</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-5 lg:px-6">
      <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer account</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Your details</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Keep your saved details up to date for faster checkout. These details can now prefill checkout when you are signed in.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Full name</p>
            <p className="mt-2 font-semibold text-slate-900">{customer.fullName || "Customer"}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Email</p>
            <p className="mt-2 font-semibold text-slate-900">{customer.email}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phone</p>
            <p className="mt-2 font-semibold text-slate-900">{customer.phone || "Not added yet"}</p>
          </div>
          <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Address</p>
            <p className="mt-2 font-semibold text-slate-900">{buildSavedAddress(customer) || "Not added yet"}</p>
          </div>
        </div>

<div className="mt-8">
  <div className="mb-4 flex items-center justify-between gap-3">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order history</p>
      <h2 className="mt-1 text-xl font-bold text-slate-900">Your recent orders</h2>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
      {orders.length} order{orders.length === 1 ? "" : "s"}
    </div>
  </div>

  {ordersLoading ? (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
      Loading your recent orders…
    </div>
  ) : orders.length ? (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {order.orderType ? order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1) : "Order"} · {order.id.slice(0, 8)}
              </h3>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {order.status}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {order.total.toFixed(2)}
              </span>
              {order.receiptUrl ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <a
                    href={order.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                  >
                    View Receipt
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleShareReceipt(order)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    aria-label="Share receipt"
                    title="Share receipt"
                  >
                    ↗
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {order.itemsSummary.length ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Items</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{order.itemsSummary.join(", ")}</p>
            </div>
          ) : null}

          {(order.paymentMethodLabel || order.paymentReference || order.rewardDiscountAmount || order.discountAmount || order.receiptNumber) ? (
            <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/45 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Premium receipt</p>
              <div className="mt-2 grid gap-2 text-sm leading-6 text-slate-700 sm:grid-cols-2">
                <p><span className="font-semibold text-slate-900">Receipt:</span> {order.receiptNumber || `ORD-${order.id.slice(0, 8).toUpperCase()}`}</p>
                {order.paymentMethodLabel ? <p><span className="font-semibold text-slate-900">Payment:</span> {order.paymentMethodLabel}</p> : null}
                {order.paymentReference ? <p><span className="font-semibold text-slate-900">Reference:</span> {order.paymentReference}</p> : null}
                {order.paidAt ? <p><span className="font-semibold text-slate-900">Paid:</span> {new Date(order.paidAt).toLocaleDateString()}</p> : null}
                {order.rewardDiscountAmount ? <p><span className="font-semibold text-slate-900">Rewards saved:</span> {order.rewardDiscountAmount.toFixed(2)}</p> : null}
                {order.discountAmount ? <p><span className="font-semibold text-slate-900">Discount saved:</span> {order.discountAmount.toFixed(2)}</p> : null}
              </div>
            </div>
          ) : null}

          {order.address || order.notes ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {order.address ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Address</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{order.address}</p>
                </div>
              ) : null}
              {order.notes ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Notes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{order.notes}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  ) : (
    <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
      No orders yet. Once you place an order while signed in, it will appear here.
    </div>
  )}
</div>


        {message ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Edit details
          </button>
          <a href="/" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
            Back to storefront
          </a>
          <form action="/api/customer/auth/logout?next=/" method="post">
            <button className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
              Sign out
            </button>
          </form>
        </div>
      </section>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-6">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:max-h-[88vh] sm:rounded-[28px]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer details</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Edit saved profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                aria-label="Close profile editor"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-5 py-5 pb-8 sm:px-6 sm:pb-10">
              <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                <input name="fullName" defaultValue={customer.fullName || ""} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
                <input name="phone" defaultValue={customer.phone || ""} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input value={customer.email} disabled className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Address line 1</label>
                <input name="addressLine1" defaultValue={customer.addressLine1 || ""} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Address line 2</label>
                <input name="addressLine2" defaultValue={customer.addressLine2 || ""} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Town / City</label>
                  <input name="city" defaultValue={customer.city || ""} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Postcode / Area</label>
                  <input name="postcode" defaultValue={customer.postcode || ""} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400" />
                </div>
              </div>

              <div className="-mx-5 mt-6 border-t border-slate-200 bg-white px-5 pb-1 pt-4 sm:-mx-6 sm:px-6"><div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save details"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div></div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
