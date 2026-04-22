"use client";

import { useEffect, useMemo, useState } from "react";
import { LIVE_VERSION } from "@/lib/version";

type RemoteStatus = {
  activeSubscriptions: number;
  vapidConfigured: boolean;
  permissionHint?: string;
  error?: string;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function AdminPushNotificationsCard() {
  const [permission, setPermission] = useState<string>("unsupported");
  const [busy, setBusy] = useState(false);
  const [realBusy, setRealBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"info" | "success" | "error">("info");
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus | null>(null);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";

  async function refreshStatus() {
    try {
      const response = await fetch("/api/admin/push-subscriptions", { cache: "no-store" });
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
  }, []);

  const statusClass = useMemo(() => {
    if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (tone === "error") return "border-rose-200 bg-rose-50 text-rose-800";
    return "border-slate-200 bg-slate-50 text-slate-700";
  }, [tone]);

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setTone("error");
      setMessage("This device or browser does not support web push notifications.");
      return;
    }

    if (!vapidPublicKey) {
      setTone("error");
      setMessage("Add the public VAPID key before enabling real admin push notifications.");
      return;
    }

    setBusy(true);
    setTone("info");
    setMessage("Registering this device for real admin push...");

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

      const response = await fetch("/api/admin/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save push subscription");

      setTone("success");
      setMessage(payload.message || "This device is now saved for real admin push notifications.");
      await refreshStatus();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to enable push notifications.");
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
        const response = await fetch("/api/admin/push-subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Could not disable push notifications on this device.");
        await subscription.unsubscribe();
      }
      setTone("success");
      setMessage("Push notifications disabled on this device.");
      await refreshStatus();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Could not disable push notifications on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function showLocalTestNotification() {
    if (!("serviceWorker" in navigator)) return;
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Orduva Admin", {
        body: "Local test notification from the installed admin PWA.",
        icon: "/orduva-admin-icon-192.png",
        badge: "/orduva-admin-icon-192.png",
        tag: "orduva-admin-local-test",
        data: { url: "/admin/orders" },
      });
      setTone("success");
      setMessage("Local test notification sent to this device.");
    } catch {
      setTone("error");
      setMessage("Could not show a local test notification on this device.");
    }
  }

  async function sendRealPushTest() {
    setRealBusy(true);
    try {
      const response = await fetch("/api/admin/push-subscriptions/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Real push test failed.");
      setTone("success");
      setMessage(payload.message || "Real push test sent.");
      await refreshStatus();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Real push test failed.");
    } finally {
      setRealBusy(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Push notifications</p>
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Admin {LIVE_VERSION.replace("Ver: ", "")}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Live admin push for new orders</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This build saves the installed admin device subscription and attempts a real web push when a new order is placed.
            Customer notification events are still being staged in the background for the next phase.
          </p>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p><span className="font-semibold text-slate-900">Permission:</span> {permission}</p>
          <p className="mt-1"><span className="font-semibold text-slate-900">Saved devices:</span> {remoteStatus?.activeSubscriptions ?? 0}</p>
          <p className="mt-1"><span className="font-semibold text-slate-900">VAPID:</span> {remoteStatus?.vapidConfigured ? "configured" : "missing"}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 1</p>
          <p className="mt-2 text-base font-semibold text-slate-900">Enable device push</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Grant permission from the installed admin PWA on your phone.</p>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 2</p>
          <p className="mt-2 text-base font-semibold text-slate-900">Save subscription</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">The device endpoint is saved against the current tenant for real push delivery.</p>
        </div>
        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 3</p>
          <p className="mt-2 text-base font-semibold text-slate-900">Receive new order pushes</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">New orders now attempt a real push to the installed admin devices for this tenant.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button onClick={() => void enablePush()} disabled={busy} className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
          {busy ? "Working..." : "Enable admin push"}
        </button>
        <button onClick={() => void sendRealPushTest()} disabled={realBusy} className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60">
          {realBusy ? "Sending..." : "Send real push test"}
        </button>
        <button onClick={() => void showLocalTestNotification()} className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
          Send local test notification
        </button>
        <button onClick={() => void disablePush()} className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
          Disable on this device
        </button>
      </div>

      {!vapidPublicKey ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add <span className="font-semibold">NEXT_PUBLIC_VAPID_PUBLIC_KEY</span>, <span className="font-semibold">VAPID_PRIVATE_KEY</span>, and <span className="font-semibold">VAPID_SUBJECT</span> before expecting real server push delivery.
        </div>
      ) : null}

      {remoteStatus?.permissionHint ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {remoteStatus.permissionHint}
        </div>
      ) : null}

      {message ? <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${statusClass}`}>{message}</div> : null}
    </section>
  );
}
