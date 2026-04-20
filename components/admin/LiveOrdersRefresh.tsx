"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  intervalSeconds?: number;
};

export default function LiveOrdersRefresh({ intervalSeconds = 20 }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);

  useEffect(() => {
    if (!enabled) return;

    const tick = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(tick);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (secondsLeft > 0) return;

    router.refresh();
    setSecondsLeft(intervalSeconds);
  }, [enabled, secondsLeft, intervalSeconds, router]);

  useEffect(() => {
    if (enabled) {
      setSecondsLeft(intervalSeconds);
    }
  }, [enabled, intervalSeconds]);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live orders view</p>
          <p className="mt-2 text-sm text-slate-600">
            {enabled
              ? `Auto-refreshing every ${intervalSeconds} seconds. Next refresh in ${secondsLeft}s.`
              : "Auto-refresh is paused. Resume when you want the orders view to keep checking for new activity."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEnabled((current) => !current)}
          className="admin-pressable inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          {enabled ? "Pause live refresh" : "Resume live refresh"}
        </button>
      </div>
    </div>
  );
}
