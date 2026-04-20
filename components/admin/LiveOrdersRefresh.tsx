"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  intervalSeconds?: number;
  currentNewCount?: number;
};

function playAlertTone() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtx) return false;

    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(988, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.36);

    window.setTimeout(() => {
      void ctx.close().catch(() => undefined);
    }, 500);

    return true;
  } catch {
    return false;
  }
}

export default function LiveOrdersRefresh({ intervalSeconds = 20, currentNewCount = 0 }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);
  const [alertVisible, setAlertVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundMessage, setSoundMessage] = useState("");

  const countStorageKey = useMemo(() => "orduva-last-seen-new-order-count", []);
  const soundStorageKey = useMemo(() => "orduva-alert-sound-enabled", []);

  useEffect(() => {
    try {
      const savedSoundPreference = window.localStorage.getItem(soundStorageKey);
      if (savedSoundPreference === "true") {
        setSoundEnabled(true);
      }
    } catch {
      // no-op
    }
  }, [soundStorageKey]);

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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(countStorageKey);
      const previous = saved ? Number(saved) : 0;
      const safePrevious = Number.isFinite(previous) ? previous : 0;

      if (currentNewCount > safePrevious) {
        setAlertVisible(true);

        if (soundEnabled) {
          playAlertTone();
        }

        if ("vibrate" in navigator) {
          navigator.vibrate?.([180, 120, 180]);
        }
      }

      window.localStorage.setItem(countStorageKey, String(currentNewCount));
    } catch {
      // no-op
    }
  }, [currentNewCount, countStorageKey, soundEnabled]);

  function enableAlertSound() {
    const ok = playAlertTone();
    if (ok) {
      setSoundEnabled(true);
      setSoundMessage("Alert sound enabled for this device/browser.");
      try {
        window.localStorage.setItem(soundStorageKey, "true");
      } catch {
        // no-op
      }
    } else {
      setSoundMessage("Could not enable sound on this browser yet. Try tapping again.");
    }
  }

  return (
    <div className="space-y-4">
      {alertVisible ? (
        <div className="rounded-[24px] border border-amber-300 bg-amber-50 p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">New order alert</p>
              <p className="mt-2 text-sm font-medium text-amber-900">
                A new order has come in. It should now be highlighted in the orders list below.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAlertVisible(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100/40"
            >
              Dismiss alert
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live orders view</p>
              <p className="mt-2 text-sm text-slate-600">
                {enabled
                  ? `Auto-refreshing every ${intervalSeconds} seconds. Next refresh in ${secondsLeft}s. New orders waiting: ${currentNewCount}.`
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

          <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Alert sound</p>
              <p className="mt-1 text-sm text-slate-600">
                {soundEnabled
                  ? "Alert sound is enabled on this device/browser."
                  : "Tap once to enable browser-safe alert sound for future new orders."}
              </p>
              {soundMessage ? <p className="mt-1 text-xs font-medium text-slate-500">{soundMessage}</p> : null}
            </div>

            <button
              type="button"
              onClick={enableAlertSound}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              {soundEnabled ? "Test alert sound" : "Enable alert sound"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
