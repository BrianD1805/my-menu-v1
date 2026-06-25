"use client";

import { useEffect, useMemo, useState } from "react";

type PushTemplate = {
  audience: "admin" | "customer";
  eventType: string;
  label: string;
  description: string;
  titleTemplate: string;
  bodyTemplate: string;
  enabled: boolean;
};

type RemoteStatus = {
  activeSubscriptions: number;
  disabledSubscriptions?: number;
  totalSubscriptions?: number;
  vapidConfigured: boolean;
  alertStatus?: "active" | "disabled" | "missing" | "error";
  warning?: string | null;
  latestSeenAt?: string | null;
  permissionHint?: string;
  error?: string;
};

type SaveTone = "info" | "success" | "error";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function templatesFingerprint(templates: PushTemplate[]) {
  return JSON.stringify(
    templates.map((item) => ({
      audience: item.audience,
      eventType: item.eventType,
      titleTemplate: item.titleTemplate,
      bodyTemplate: item.bodyTemplate,
      enabled: item.enabled,
    })),
  );
}

export default function PushNotificationSettingsPanel() {
  const [templates, setTemplates] = useState<PushTemplate[]>([]);
  const [savedFingerprint, setSavedFingerprint] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deviceBusy, setDeviceBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<SaveTone>("info");
  const [permission, setPermission] = useState<string>("unsupported");
  const [remoteStatus, setRemoteStatus] = useState<RemoteStatus | null>(null);
  const [canEnableThisDevice, setCanEnableThisDevice] = useState(false);
  const [deviceStatusLabel, setDeviceStatusLabel] = useState("Checking this device...");
  const [statusCheckedAt, setStatusCheckedAt] = useState<string | null>(null);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";

  const dirty = templatesFingerprint(templates) !== savedFingerprint;

  async function refreshDeviceStatus() {
    try {
      const response = await fetch("/api/admin/push-subscriptions", { cache: "no-store" });
      const payload = await response.json();
      setRemoteStatus(payload);
      setStatusCheckedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      if (!response.ok && payload?.error) {
        setTone("error");
        setMessage(payload.error);
      }
    } catch {
      // Keep the settings editor usable even if the device status check fails.
    }

    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }

  async function loadTemplates() {
    setLoading(true);
    try {
      const [settingsResponse] = await Promise.all([
        fetch("/api/admin/push-notification-settings", { cache: "no-store" }),
        refreshDeviceStatus(),
      ]);
      const payload = await settingsResponse.json();
      if (!settingsResponse.ok) throw new Error(payload.error || "Could not load push notification settings.");
      const nextTemplates = payload.templates || [];
      setTemplates(nextTemplates);
      setSavedFingerprint(templatesFingerprint(nextTemplates));
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Could not load push notification settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTemplates();
  }, []);
  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      typeof Notification !== "undefined";

    if (!supported) {
      setCanEnableThisDevice(false);
      setDeviceStatusLabel("This browser cannot register for web push notifications.");
      return;
    }

    const userAgent = navigator.userAgent || "";
    const isMobileOrTablet =
      /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(userAgent) ||
      (navigator.maxTouchPoints || 0) > 1 && window.matchMedia("(pointer: coarse)").matches;

    setCanEnableThisDevice(isMobileOrTablet);
    setDeviceStatusLabel(
      isMobileOrTablet
        ? "This mobile/tablet device can be saved for Store Admin push alerts."
        : "Open this section on the Store Admin phone or tablet to enable this device. Desktop can still send a real push test to saved devices."
    );
  }, []);


  const grouped = useMemo(() => {
    return {
      admin: templates.filter((item) => item.audience === "admin"),
      customer: templates.filter((item) => item.audience === "customer"),
    };
  }, [templates]);

  function updateTemplate(index: number, patch: Partial<PushTemplate>) {
    setTemplates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function saveTemplates() {
    setSaving(true);
    setTone("info");
    setMessage("Saving push notification settings...");
    try {
      const response = await fetch("/api/admin/push-notification-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save push notification settings.");
      const nextTemplates = payload.templates || templates;
      setTemplates(nextTemplates);
      setSavedFingerprint(templatesFingerprint(nextTemplates));
      setTone("success");
      setMessage(payload.message || "Push notification settings saved.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Could not save push notification settings.");
    } finally {
      setSaving(false);
    }
  }

  async function enableAdminPushOnThisDevice() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") {
      setTone("error");
      setMessage("This device or browser does not support web push notifications.");
      return;
    }

    if (!vapidPublicKey) {
      setTone("error");
      setMessage("VAPID keys are missing. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT before real push can work.");
      return;
    }

    setDeviceBusy(true);
    setTone("info");
    setMessage("Saving this Store Admin device for push alerts...");

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        setTone("error");
        setMessage("Notification permission is not granted on this device.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing || await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const response = await fetch("/api/admin/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save push subscription.");

      setTone("success");
      setMessage(payload.message || "This device is now saved for Store Admin push alerts.");
      await refreshDeviceStatus();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to enable Store Admin push on this device.");
    } finally {
      setDeviceBusy(false);
    }
  }

  async function sendAdminTest() {
    setTesting(true);
    setTone("info");
    setMessage("Sending Store Admin test push...");
    try {
      const response = await fetch("/api/admin/push-subscriptions/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Store Admin push test failed.");
      setTone("success");
      setMessage(payload.message || "Store Admin push test sent.");
      await refreshDeviceStatus();
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Store Admin push test failed.");
      await refreshDeviceStatus();
    } finally {
      setTesting(false);
    }
  }

  const messageClass = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : tone === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-slate-200 bg-slate-50 text-slate-700";

  function renderTemplateCard(template: PushTemplate, globalIndex: number) {
    return (
      <div key={`${template.audience}-${template.eventType}`} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900">{template.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{template.description}</p>
          </div>
          <label className="flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={template.enabled}
              onChange={(event) => updateTemplate(globalIndex, { enabled: event.target.checked })}
            />
            Send push for this event
          </label>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="text-sm font-semibold text-slate-700">
            Push title
            <input
              value={template.titleTemplate}
              onChange={(event) => updateTemplate(globalIndex, { titleTemplate: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
              maxLength={90}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Push message
            <textarea
              value={template.bodyTemplate}
              onChange={(event) => updateTemplate(globalIndex, { bodyTemplate: event.target.value })}
              className="mt-2 min-h-20 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
              maxLength={260}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <details
      id="push-notifications"
      className="group mx-auto w-full scroll-mt-28 overflow-hidden rounded-[24px] bg-[#9fbfdf]/45 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition md:hover:bg-[#9fbfdf]/55"
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-3 py-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-slate-300 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="mb-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-700">
              Notifications
            </span>
            {dirty ? (
              <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-700">
                Unsaved
              </span>
            ) : (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">
                Saved
              </span>
            )}
          </span>
          <span className="block text-base font-semibold text-slate-950 sm:text-lg">
            Push notifications
          </span>
          <span className="mt-1.5 block text-xs leading-5 text-slate-600 sm:text-sm">
            Store Admin device alerts, customer order-flow pushes and editable wording.
          </span>
        </span>
        <span
          className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-semibold text-slate-700 shadow-sm transition group-open:rotate-45 group-open:bg-slate-950 group-open:text-white"
          aria-hidden="true"
        >
          +
        </span>
      </summary>

      <div className="bg-white px-3 pb-4 pt-4 sm:px-5 sm:pb-5">
        <div className="grid gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Store Admin push alerts</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Browser permission being allowed is only step one. This Store Admin device must also save a push subscription against this store before server-sent new order alerts can reach the phone.
            </p>
            <div className="mt-4 grid gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p><span className="font-semibold text-slate-900">Phone/browser permission:</span> {permission}</p>
              <p><span className="font-semibold text-slate-900">Saved Store Admin devices:</span> {remoteStatus?.activeSubscriptions ?? 0}</p>
              <p><span className="font-semibold text-slate-900">Disabled devices:</span> {remoteStatus?.disabledSubscriptions ?? 0}</p>
              <p><span className="font-semibold text-slate-900">VAPID keys:</span> {remoteStatus?.vapidConfigured ? "configured" : "missing"}</p>
              <p><span className="font-semibold text-slate-900">This device:</span> {deviceStatusLabel}</p>
              {statusCheckedAt ? <p><span className="font-semibold text-slate-900">Status checked:</span> {statusCheckedAt}</p> : null}
              {remoteStatus?.warning ? <p className="font-semibold text-amber-800">{remoteStatus.warning}</p> : null}
            </div>
            {permission === "granted" && (remoteStatus?.activeSubscriptions ?? 0) === 0 ? (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                {canEnableThisDevice ? (
                  <>Notifications are allowed on this phone/tablet, but no active Store Admin push subscription is saved for this store. Tap <strong>Enable admin push on this device</strong>, then send a real push test.</>
                ) : (
                  <>Notifications are allowed here, but this screen only enables admin push on phones and tablets. Open Store settings on the Store Admin phone/tablet, enable the device there, then use <strong>Send real push test</strong>.</>
                )}
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {canEnableThisDevice ? (
                <button onClick={() => void enableAdminPushOnThisDevice()} disabled={deviceBusy} type="button" className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                  {deviceBusy ? "Working..." : "Enable admin push on this device"}
                </button>
              ) : null}
              <button onClick={() => void sendAdminTest()} disabled={testing} type="button" className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60">
                {testing ? "Sending..." : "Send real push test"}
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Device status is checked automatically when this section opens, after enabling a phone/tablet, and after a real push test.
            </p>
          </div>

          {message ? <div className={`rounded-2xl border px-4 py-3 text-sm ${messageClass}`}>{message}</div> : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">Loading push notification settings...</div>
          ) : (
            <div className="grid gap-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Admin push wording</h3>
                <div className="mt-3 grid gap-3">
                  {grouped.admin.map((template) => renderTemplateCard(template, templates.findIndex((item) => item.audience === template.audience && item.eventType === template.eventType)))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Customer push wording and status controls</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Untick a status if you still want to mark the order at that stage but do not want a customer push for that particular status.
                </p>
                <div className="mt-3 grid gap-3">
                  {grouped.customer.map((template) => renderTemplateCard(template, templates.findIndex((item) => item.audience === template.audience && item.eventType === template.eventType)))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
                Available text placeholders: {"{defaultTitle}"}, {"{defaultBody}"}, {"{orderId}"}, {"{status}"}. If a placeholder is not available for a specific notification it will be left blank.
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end pt-1">
          <button
            type="button"
            onClick={() => void saveTemplates()}
            disabled={saving || loading || !dirty}
            className={`inline-flex min-h-10 w-full items-center justify-center rounded-xl border px-4 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-100 sm:w-auto ${dirty ? "border-red-200 bg-red-100 text-red-800 hover:bg-red-200" : "border-slate-950 bg-slate-950 text-white"}`}
          >
            {saving ? "Saving..." : dirty ? "Save push notifications" : "Nothing to save"}
          </button>
        </div>
      </div>
    </details>
  );
}
