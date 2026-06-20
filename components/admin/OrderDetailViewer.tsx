"use client";

import { useMemo, useState } from "react";

type OrderItem = {
  quantity: number;
  lineTotal: number;
  productName: string | null;
};

type OrderPayload = {
  id: string;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  orderType: string | null;
  createdAt: string;
  total: number;
  paymentMethodLabel?: string | null;
  paymentStatus?: string | null;
  items: OrderItem[];
};

function formatMoney(amount: number, currencyCode: string, decimals: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currencyCode || "GBP",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export default function OrderDetailViewer({
  order,
  currencyCode,
  decimals,
}: {
  order: OrderPayload;
  currencyCode: string;
  decimals: number;
}) {
  const [open, setOpen] = useState(false);

  const summary = useMemo(() => {
    if (!order.items.length) return "Order contents not available yet.";
    return order.items.map((item) => `${item.quantity} × ${item.productName || "Item"}`).join(", ");
  }, [order.items]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
      >
        View order
      </button>

      {open ? (
        <div className="orduva-admin-popup-overlay z-50">
          <div className="orduva-admin-popup-shell">
            <div className="orduva-admin-popup-header">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order viewer</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Order {order.id}</h3>
                <p className="mt-1 text-sm text-slate-600">{summary}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="admin-pressable orduva-admin-popup-close-icon"
                aria-label="Close order viewer"
              >
                ×
              </button>
            </div>

            <div className="orduva-admin-popup-body">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer</p>
                  <p className="mt-2 font-semibold text-slate-900">{order.customerName || "Walk-in / Guest"}</p>
                  <p className="mt-1 text-sm text-slate-600">{order.customerPhone || "No phone provided"}</p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order details</p>
                  <p className="mt-2 font-semibold text-slate-900">{order.orderType || "Order"}</p>
                  <p className="mt-1 text-sm text-slate-600">{new Date(order.createdAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm text-slate-600">Status: {order.status}</p>
                </div>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Payment</p>
                  <p className="mt-2 font-semibold text-slate-900">{order.paymentMethodLabel || "Payment method not recorded"}</p>
                  <p className="mt-1 text-sm text-slate-600">Status: {order.paymentStatus || "pay_on_fulfilment"}</p>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Items ordered</p>
                  <p className="text-sm font-semibold text-slate-900">{formatMoney(order.total, currencyCode, decimals)}</p>
                </div>
                <div className="mt-3 space-y-2">
                  {order.items.length ? order.items.map((item, idx) => (
                    <div
                      key={`${order.id}-${idx}`}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                    >
                      <span className="font-medium text-slate-800">{item.quantity} × {item.productName || "Item"}</span>
                      <span className="text-slate-600">{formatMoney(item.lineTotal, currencyCode, decimals)}</span>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Order contents not available yet.
                    </div>
                  )}
                </div>
              </div>

              {order.notes ? (
                <div className="mt-4 rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer notes</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{order.notes}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
