"use client";

import { useEffect, useMemo, useState } from "react";
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
  paymentProvider: string | null;
  paymentMethodLabel: string | null;
  paymentStatus: string | null;
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

function paymentStatusLabel(status: string | null) {
  if (status === "paid") return "Paid";
  if (status === "pending_online_payment") return "Awaiting online payment";
  if (status === "failed") return "Payment failed";
  if (status === "cancelled") return "Payment cancelled";
  if (status === "refunded") return "Refunded";
  return "Pay on fulfilment";
}

function paymentBadgeTone(status: string | null) {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "failed" || status === "cancelled") return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "pending_online_payment") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
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

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    const bodyTouchAction = document.body.style.touchAction;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      document.body.style.touchAction = bodyTouchAction;
    };
  }, [locked]);
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

  useBodyScrollLock(open);

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
        <div className="orduva-admin-popup-overlay z-50">
          <div className="orduva-admin-popup-shell">
            <div className="orduva-admin-popup-header">
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
                className="admin-pressable orduva-admin-popup-close-icon"
                aria-label="Close order queue"
              >
                ×
              </button>
            </div>

            <div className="orduva-admin-popup-body">
              {!orders.length ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  No orders in this queue right now.
                </div>
              ) : null}

              <div className="space-y-4 pb-8 sm:pb-10">
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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${paymentBadgeTone(order.paymentStatus)}`}>
                              {paymentStatusLabel(order.paymentStatus)}
                            </span>
                            {order.paymentMethodLabel ? (
                              <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                                {order.paymentMethodLabel}
                              </span>
                            ) : null}
                          </div>
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
                              paymentMethodLabel: order.paymentMethodLabel,
                              paymentStatus: order.paymentStatus,
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
