"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  currentStatus: string;
};

function labelForStatus(status: string) {
  switch (status) {
    case "ready":
      return "Out for delivery";
    case "completed":
      return "Delivered / finalised";
    default:
      return status;
  }
}

export default function OrderStatusForm({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const completed = currentStatus === "completed";

  async function updateStatus() {
    setSaving(true);

    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await res.json();

    if (!res.ok) {
      window.alert(data.error || "Failed to update status");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.refresh();
  }

  if (completed) {
    return (
      <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Finalised</p>
        <p className="mt-1 font-semibold">Delivered order</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="admin-pressable rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 transition hover:border-slate-300 focus:border-slate-400 focus:outline-none"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="new">New</option>
        <option value="accepted">Accepted</option>
        <option value="preparing">Preparing</option>
        <option value="ready">Out for delivery</option>
        <option value="completed">Delivered / finalised</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <button
        onClick={() => void updateStatus()}
        disabled={saving}
        className="admin-pressable rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        aria-label={`Save ${labelForStatus(status)} for order ${orderId}`}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
