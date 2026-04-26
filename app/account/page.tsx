"use client";

import { useEffect, useState } from "react";

type AccountOrder = {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  orderType: string | null;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  address: string | null;
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

export default function CustomerAccountPage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [orders, setOrders] = useState<AccountOrder[]>([]);

  useEffect(() => {
    async function load() {
      const [meRes, ordersRes] = await Promise.all([
        fetch("/api/customer/auth/me", { cache: "no-store" }),
        fetch("/api/customer/orders", { cache: "no-store" }),
      ]);

      const meData = await meRes.json().catch(() => ({}));
      const ordersData = await ordersRes.json().catch(() => ({}));

      if (meRes.ok && meData?.customer) setCustomer(meData.customer);
      if (ordersRes.ok && Array.isArray(ordersData?.orders)) setOrders(ordersData.orders);
      setLoading(false);
    }
    void load();
  }, []);

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
    return <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 sm:px-5 lg:px-6">Loading account…</main>;
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
          Keep your saved details up to date for faster checkout. Only the first line of address is shown in the main account summary.
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
            <p className="mt-2 font-semibold text-slate-900">{customer.addressLine1 || "Not added yet"}</p>
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

  {orders.length ? (
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
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {order.status}
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                {order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {order.itemsSummary.length ? (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Items</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{order.itemsSummary.join(", ")}</p>
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

              <div className="sticky bottom-0 -mx-5 border-t border-slate-200 bg-white px-5 pb-1 pt-4 sm:-mx-6 sm:px-6"><div className="flex flex-wrap gap-3">
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
