"use client";

import { useMemo, useState } from "react";
import OrderStatusForm from "@/components/admin/OrderStatusForm";
import OrderDetailViewer from "@/components/admin/OrderDetailViewer";

type QueueItem = {
  id: string;
  status: string;
  total: number;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  orderType: string | null;
  createdAt: string;
  items: {
    quantity: number;
    lineTotal: number;
    productName: string | null;
  }[];
};

function labelForStatus(status: string) {
  switch (status) {
    case "ready":
      return "Out for delivery";
    case "completed":
      return "Delivered";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function buildItemsSummary(items: QueueItem["items"]) {
  if (!items.length) return "Order contents not available yet.";
  return items.map((item) => `${item.quantity} × ${item.productName || "Item"}`).join(", ");
}

function statusTone(status: string) {
  switch (status) {
    case "new":
      return "border-amber-200 bg-amber-50/70 text-amber-900";
    case "accepted":
      return "border-blue-200 bg-blue-50/70 text-blue-900";
    case "preparing":
      return "border-yellow-200 bg-yellow-50/70 text-yellow-900";
    case "ready":
      return "border-indigo-200 bg-indigo-50/70 text-indigo-900";
    case "completed":
      return "border-emerald-200 bg-emerald-50/70 text-emerald-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-900";
  }
}

export default function OrderQueuePopup({
  label,
  count,
  orders,
  currencyCode,
  decimals,
}: {
  label: string;
  count: number;
  orders: QueueItem[];
  currencyCode: string;
  decimals: number;
}) {
  const [open, setOpen] = useState(false);

  const cardSummary = useMemo(() => `${count} ${count === 1 ? "order" : "orders"}`, [count]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group w-full rounded-[24px] border p-4 text-left shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(15,23,42,0.08)] ${statusTone(orders[0]?.status || "all")}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
            <p className="mt-2 text-3xl font-bold">{count}</p>
            <p className="mt-1 text-sm opacity-80">{cardSummary}</p>
          </div>
          <span className="rounded-2xl border border-current/20 bg-white/70 px-3 py-1.5 text-xs font-semibold transition group-hover:bg-white">
            Open
          </span>
        </div>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-6">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-t-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)] sm:rounded-[28px]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order queue</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{label}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Work through the {label.toLowerCase()} queue here without leaving the dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="admin-pressable inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                aria-label="Close order queue"
              >
                ×
              </button>
            </div>

            <div className="max-h-[calc(94vh-88px)] overflow-y-auto px-5 py-5 sm:px-6">
              {!orders.length ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  No orders in this queue right now.
                </div>
              ) : null}

              <div className="space-y-4">
                {orders.map((order) => {
                  const summary = buildItemsSummary(order.items);

                  return (
                    <div key={order.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">Order {order.id}</p>
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                              {labelForStatus(order.status)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {order.orderType || "Order"} · {new Intl.NumberFormat("en-GB", {
                              style: "currency",
                              currency: currencyCode || "GBP",
                              minimumFractionDigits: decimals,
                              maximumFractionDigits: decimals,
                            }).format(order.total)}
                          </p>
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                          <p className="text-sm text-slate-700">
                            {order.customerName || "Walk-in / Guest"}
                            {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                          </p>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Summary</p>
                            <p className="mt-1 font-medium text-slate-800">{summary}</p>
                          </div>
                          {order.notes ? <p className="text-sm text-slate-600">Notes: {order.notes}</p> : null}
                        </div>

                        <div className="flex w-full max-w-[360px] flex-col gap-3">
                          <OrderDetailViewer
                            order={{
                              id: order.id,
                              status: labelForStatus(order.status),
                              customerName: order.customerName,
                              customerPhone: order.customerPhone,
                              notes: order.notes,
                              orderType: order.orderType,
                              createdAt: order.createdAt,
                              total: order.total,
                              items: order.items,
                            }}
                            currencyCode={currencyCode}
                            decimals={decimals}
                          />
                          <OrderStatusForm orderId={order.id} currentStatus={order.status} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
