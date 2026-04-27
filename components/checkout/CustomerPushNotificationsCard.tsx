"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type RemoteStatus = {
  activeSubscriptions: number;
  vapidConfigured: boolean;
  reusableDeviceRegistered?: boolean;
  linkedToThisOrder?: boolean;
  orderStatus?: string;
  error?: string;
};

export default function CustomerPushNotificationsCard({
  tenantSlug,
  orderId,
  customerPhone,
  customerName,
  customerAccountId,
}: {
  tenantSlug: string;
  orderId: string;
  customerPhone: string;
  customerName: string;
  customerAccountId?: string | null;
}) {
  const [permission, setPermission] = useState<string>("unsupported");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"info" | "success" | "error">("info");
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus | null>(null);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";

  async function refreshStatus() {
    try {
      let endpoint = "";
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        endpoint = subscription?.endpoint || "";
      }
      const url = `/api/customer/push-subscriptions?orderId=${encodeURIComponent(orderId)}&endpoint=${encodeURIComponent(endpoint)}`;
      const response = await fetch(url, { cache: "no-store" });
      const payload = await response.json();
      setRemoteStatus(payload);
      if (!response.ok && payload?.error) {
        setTone("error");
        setMessage(payload.error);
      }
    } catch {
      // Keep the customer-facing card quiet if the background check fails.
    }

    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }

  useEffect(() => {
    void refreshStatus();
  }, [tenantSlug, orderId, customerPhone]);

  useEffect(() => {
    async function relinkCurrentOrderIfNeeded() {
      if (!("serviceWorker" in navigator) || typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      await fetch("/api/customer/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          orderId,
          customerPhone,
          customerName,
          customerAccountId,
          subscription: subscription.toJSON(),
        }),
      }).catch(() => null);

      await refreshStatus();
    }

    void relinkCurrentOrderIfNeeded();
  }, [tenantSlug, orderId, customerPhone, customerName, customerAccountId]);

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setTone("error");
      setMessage("This device does not support order update notifications.");
      return;
    }

    if (!vapidPublicKey) {
      setTone("error");
      setMessage("Order update notifications are not available right now.");
      return;
    }

    setBusy(true);
    setTone("info");
    setMessage("Turning on order updates...");

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setTone("error");
        setMessage("Notifications were not allowed on this device.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const response = await fetch("/api/customer/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          orderId,
          customerPhone,
          customerName,
          customerAccountId,
          subscription: subscription.toJSON(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not turn on order updates.");

      setTone("success");
      setMessage("Order updates are on for this device.");
      await refreshStatus();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Could not turn on order updates.");
    } finally {
      setBusy(false);
    }
  }

  async function disablePush() {
    if (!("serviceWorker" in navigator)) return;
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const response = await fetch("/api/customer/push-subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantSlug, orderId, customerPhone, endpoint: subscription.endpoint }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not turn off order updates on this device.");
        await subscription.unsubscribe();
      }
      setTone("success");
      setMessage("Order updates are off on this device.");
      await refreshStatus();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Could not turn off order updates.");
    } finally {
      setBusy(false);
    }
  }

  const notificationsOn = permission === "granted" && (remoteStatus?.activeSubscriptions ?? 0) > 0;
  const denied = permission === "denied";
  const messageClass =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-slate-200 bg-white text-slate-700";

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order updates</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            {notificationsOn ? "Updates are on for this device" : "Get notified when your order changes"}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            {notificationsOn
              ? "You’ll receive updates here when this order is accepted, prepared, ready, or delivered."
              : denied
                ? "Notifications are blocked in your browser settings. You can still check your order status here."
                : "Turn on notifications once and we’ll send order updates to this device."}
          </p>
        </div>

        <div className="shrink-0">
          {notificationsOn ? (
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
              On
            </span>
          ) : (
            <button
              onClick={() => void enablePush()}
              disabled={busy || denied}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Working..." : "Enable updates"}
            </button>
          )}
        </div>
      </div>

      {message ? <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${messageClass}`}>{message}</div> : null}

      {notificationsOn ? (
        <button onClick={() => void disablePush()} disabled={busy} className="mt-4 text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-800 disabled:opacity-60">
          Turn off updates on this device
        </button>
      ) : null}
    </div>
  );
}
