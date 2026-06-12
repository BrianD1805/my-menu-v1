"use client";

import { useMemo, useState } from "react";
import { formatMoney, type MoneyFormatSettings } from "@/lib/money";

type PreOrderRow = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string | null;
  preorder_status: string | null;
  preorder_balance_payment_status: string | null;
  preorder_deposit_amount: number | string | null;
  preorder_balance_amount: number | string | null;
  preorder_deposit_percent: number | string | null;
  total: number | string | null;
  created_at: string;
  payment_checkout_session_id?: string | null;
  payment_intent_id?: string | null;
  payment_reference?: string | null;
};

type Props = {
  orders: PreOrderRow[];
  depositPercent: number;
  moneySettings: MoneyFormatSettings;
};

function statusLabel(order: PreOrderRow) {
  const balance = order.preorder_balance_payment_status || "pending";
  if (balance === "paid") return "Balance paid";
  if (balance === "requested") return "Balance requested";
  if (order.preorder_status === "stock_arrived") return "Stock arrived";
  return "Awaiting stock";
}

function formatPreOrderDate(value: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return value;
  }
}

function dedupePreOrderRows(rows: PreOrderRow[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = String(row.payment_checkout_session_id || row.payment_intent_id || row.payment_reference || row.id || "").trim();
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function PreOrderManager({ orders: initialOrders, depositPercent, moneySettings }: Props) {
  const [orders, setOrders] = useState(() => dedupePreOrderRows(initialOrders));
  const [deposit, setDeposit] = useState(String(depositPercent));
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const counts = useMemo(() => ({
    all: orders.length,
    awaiting: orders.filter((order) => (order.preorder_balance_payment_status || "pending") === "pending").length,
    requested: orders.filter((order) => order.preorder_balance_payment_status === "requested").length,
    paid: orders.filter((order) => order.preorder_balance_payment_status === "paid").length,
  }), [orders]);

  async function runAction(orderId: string, action: "stock_arrived" | "balance_paid") {
    setBusyId(orderId);
    setMessage("");
    try {
      const response = await fetch("/api/admin/preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Pre-order update failed");
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, ...payload.order } : order));
      setMessage(action === "stock_arrived" ? "Customer balance push queued." : "Balance marked paid and pre-order stock deducted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Pre-order update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function saveDepositSettings() {
    setSavingDeposit(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/preorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "settings", depositPercent: deposit }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Deposit setting could not be saved");
      setDeposit(String(payload.depositPercent));
      setMessage("Pre-order deposit setting saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Deposit setting could not be saved");
    } finally {
      setSavingDeposit(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Default deposit</p><div className="mt-3 flex items-center gap-2"><input type="number" min="1" max="95" step="0.01" value={deposit} onChange={(event) => setDeposit(event.target.value)} className="w-24 rounded-2xl border border-emerald-200 px-3 py-2 text-xl font-black text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /><span className="text-2xl font-black text-slate-950">%</span></div><button type="button" onClick={saveDepositSettings} disabled={savingDeposit} className="admin-pressable mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-800 disabled:opacity-50">Save deposit</button></div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">All</p><p className="mt-2 text-3xl font-black text-slate-950">{counts.all}</p></div>
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Awaiting stock</p><p className="mt-2 text-3xl font-black text-slate-950">{counts.awaiting}</p></div>
        <div className="rounded-[24px] border border-teal-200 bg-teal-50 p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Balance paid</p><p className="mt-2 text-3xl font-black text-slate-950">{counts.paid}</p></div>
      </div>

      {message ? <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">{message}</div> : null}

      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="text-xl font-black text-slate-950">Pre-order control</h2><p className="mt-1 text-sm text-slate-600">When stock arrives, queue the customer push with a balance link. Stock is only deducted after the balance is marked paid.</p></div>
        <div className="divide-y divide-slate-100">
          {orders.length ? orders.map((order) => (
            <div key={order.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
              <div>
                <p className="text-base font-black text-slate-950">{order.customer_name || "Customer"}</p>
                <p className="mt-1 text-sm text-slate-600">{order.customer_phone || "No phone"} · {formatPreOrderDate(order.created_at)}</p>
                <p className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-700 ring-1 ring-amber-100">{statusLabel(order)}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Total</p><p className="font-black text-slate-900">{formatMoney(Number(order.total || 0), moneySettings)}</p></div>
                <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Deposit</p><p className="font-black text-slate-900">{formatMoney(Number(order.preorder_deposit_amount || 0), moneySettings)}</p></div>
                <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Balance</p><p className="font-black text-slate-900">{formatMoney(Number(order.preorder_balance_amount || 0), moneySettings)}</p></div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button type="button" disabled={busyId === order.id || order.preorder_balance_payment_status === "paid"} onClick={() => runAction(order.id, "stock_arrived")} className="admin-pressable rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-teal-800 disabled:opacity-50">Stock arrived / push</button>
                <button type="button" disabled={busyId === order.id || order.preorder_balance_payment_status === "paid"} onClick={() => runAction(order.id, "balance_paid")} className="admin-pressable rounded-2xl border border-slate-200 bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-50">Mark balance paid</button>
              </div>
            </div>
          )) : <div className="px-5 py-10 text-center text-sm text-slate-500">No pre-orders yet.</div>}
        </div>
      </div>
    </div>
  );
}
