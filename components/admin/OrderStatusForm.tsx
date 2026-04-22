"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  currentStatus: string;
};

const OPTIONS = [
  { value: "new", label: "New" },
  { value: "accepted", label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Out for delivery" },
  { value: "completed", label: "Delivered / finalised" },
  { value: "cancelled", label: "Cancelled" },
];

function labelForStatus(status: string) {
  return OPTIONS.find((option) => option.value === status)?.label || status;
}

export default function OrderStatusForm({ orderId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const router = useRouter();

  const completed = currentStatus === "completed";
  const selectedLabel = useMemo(() => labelForStatus(status), [status]);

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
    setPickerOpen(false);
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
    <>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="admin-pressable inline-flex min-h-12 flex-1 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <span>{selectedLabel}</span>
          <span className="text-slate-500">▾</span>
        </button>

        <button
          onClick={() => void updateStatus()}
          disabled={saving}
          className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          aria-label={`Save ${selectedLabel} for order ${orderId}`}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-3 sm:p-6">
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Update status</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Select order status</h3>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="admin-pressable inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
                aria-label="Close status picker"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-4 py-4 pb-6">
              <div className="space-y-2">
                {OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setStatus(option.value);
                      setPickerOpen(false);
                    }}
                    className={[
                      "admin-pressable flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                      status === option.value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    ].join(" ")}
                  >
                    <span className="font-medium">{option.label}</span>
                    {status === option.value ? <span>✓</span> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
