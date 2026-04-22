"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [testing, setTesting] = useState(false);
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
      // silent
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
}, [orderId, customerPhone, customerName]);

  const statusClass = useMemo(() => {
    if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (tone === "error") return "border-rose-200 bg-rose-50 text-rose-800";
    return "border-slate-200 bg-slate-50 text-slate-700";
  }, [tone]);

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setTone("error");
      setMessage("This device or browser does not support customer push notifications.");
      return;
    }

    if (!vapidPublicKey) {
      setTone("error");
      setMessage("VAPID keys are missing, so real customer push cannot be enabled yet.");
      return;
    }

    setBusy(true);
    setTone("info");
    setMessage("Registering this device for order updates...");

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setTone("error");
        setMessage("Notification permission was not granted.");
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
      if (!response.ok) throw new Error(payload.error || "Failed to save customer push subscription.");

      setTone("success");
      setMessage(payload.message || "This device is now saved for customer push updates.");
      await refreshStatus();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to enable customer push updates.");
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
        if (!response.ok) throw new Error(payload.error || "Could not disable customer push on this device.");
        await subscription.unsubscribe();
      }
      setTone("success");
      setMessage("Customer push notifications disabled on this device.");
      await refreshStatus();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Could not disable customer push on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function sendLocalTest() {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Order update test", {
        body: "Local customer notification test for this order.",
        icon: "/orduva-storefront-icon-192.png",
        badge: "/orduva-storefront-icon-192.png",
        tag: `orduva-customer-local-${orderId}`,
        data: { url: "/" },
      });
      setTone("success");
      setMessage("Local customer notification test sent.");
    } catch {
      setTone("error");
      setMessage("Could not show a local customer notification on this device.");
    }
  }

  async function sendRealTest() {
    setTesting(true);
    try {
      const response = await fetch("/api/customer/push-subscriptions/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Customer push test failed.");
      setTone("success");
      setMessage(payload.message || "Customer push test sent.");
      await refreshStatus();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Customer push test failed.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer push notifications</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Get live order updates on this device</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Save this device on the customer account for push updates. On later orders, Orduva can reuse the same saved device and relink the new order automatically.
          </p>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          <p><span className="font-semibold text-slate-900">Permission:</span> {permission}</p>
          <p className="mt-1"><span className="font-semibold text-slate-900">Saved customer devices:</span> {remoteStatus?.activeSubscriptions ?? 0}</p>
          <p className="mt-1"><span className="font-semibold text-slate-900">VAPID:</span> {remoteStatus?.vapidConfigured ? "configured" : "missing"}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Order received</p>
          <p className="mt-1 text-sm text-slate-600">This order is already saved and ready for the business to review.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next customer push steps</p>
          <p className="mt-1 text-sm text-slate-600">Accepted, Preparing, Out for delivery, and Delivered will be the next live customer push stages.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button onClick={() => void enablePush()} disabled={busy} className="rounded-2xl px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 bg-gray-950">
          {busy ? "Working..." : "Enable customer push"}
        </button>
        <button onClick={() => void sendRealTest()} disabled={testing} className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60">
          {testing ? "Sending..." : "Send real customer push test"}
        </button>
        <button onClick={() => void sendLocalTest()} className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
          Send local test notification
        </button>
        <button onClick={() => void disablePush()} className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
          Disable push on this device
        </button>
      </div>

      {message ? <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${statusClass}`}>{message}</div> : null}
    </div>
  );
}
