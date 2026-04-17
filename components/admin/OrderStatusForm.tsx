"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  currentStatus: string;
};

export default function OrderStatusForm({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

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

  return (
    <div className="flex items-center gap-2">
      <select
        className="admin-pressable rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 transition hover:border-slate-300 focus:border-slate-400 focus:outline-none"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="new">new</option>
        <option value="accepted">accepted</option>
        <option value="preparing">preparing</option>
        <option value="ready">ready</option>
        <option value="completed">completed</option>
        <option value="cancelled">cancelled</option>
      </select>

      <button
        onClick={() => void updateStatus()}
        disabled={saving}
        className="admin-pressable rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
