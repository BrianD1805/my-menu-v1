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

type SaveTone = "info" | "success" | "error";

export default function PushNotificationSettingsPanel() {
  const [templates, setTemplates] = useState<PushTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<SaveTone>("info");

  async function loadTemplates() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/push-notification-settings", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load push notification settings.");
      setTemplates(payload.templates || []);
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
      setTemplates(payload.templates || templates);
      setTone("success");
      setMessage(payload.message || "Push notification settings saved.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Could not save push notification settings.");
    } finally {
      setSaving(false);
    }
  }

  async function sendAdminTest() {
    setTesting(true);
    setTone("info");
    setMessage("Sending admin test push...");
    try {
      const response = await fetch("/api/admin/push-subscriptions/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Admin push test failed.");
      setTone("success");
      setMessage(payload.message || "Admin push test sent.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Admin push test failed.");
    } finally {
      setTesting(false);
    }
  }

  const messageClass = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : tone === "error" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-slate-200 bg-slate-50 text-slate-700";

  function renderTemplateCard(template: PushTemplate, globalIndex: number) {
    return (
      <div key={`${template.audience}-${template.eventType}`} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">{template.label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{template.description}</p>
          </div>
          <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={template.enabled}
              onChange={(event) => updateTemplate(globalIndex, { enabled: event.target.checked })}
            />
            Send push
          </label>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
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
    <section className="mb-6 rounded-[28px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Push notifications</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-900">Order alert wording and delivery controls</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Control the text used for Store Admin and customer order pushes. Customer status pushes can be unticked without changing the order status flow itself.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Customer pushes use the store favicon as the notification icon. Store Admin pushes use the Orduva favicon only.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <button onClick={() => void sendAdminTest()} disabled={testing} className="admin-pressable rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60">
            {testing ? "Sending..." : "Send admin test push"}
          </button>
          <button onClick={() => void saveTemplates()} disabled={saving || loading} className="admin-pressable rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60">
            {saving ? "Saving..." : "Save push settings"}
          </button>
        </div>
      </div>

      {message ? <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${messageClass}`}>{message}</div> : null}

      {loading ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">Loading push notification settings...</div>
      ) : (
        <div className="mt-6 grid gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Store Admin pushes</h3>
            <div className="mt-3 grid gap-3">
              {grouped.admin.map((template) => renderTemplateCard(template, templates.findIndex((item) => item.audience === template.audience && item.eventType === template.eventType)))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Customer order-flow pushes</h3>
            <div className="mt-3 grid gap-3">
              {grouped.customer.map((template) => renderTemplateCard(template, templates.findIndex((item) => item.audience === template.audience && item.eventType === template.eventType)))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
            Available text placeholders: {"{defaultTitle}"}, {"{defaultBody}"}, {"{orderId}"}, {"{status}"}. If a placeholder is not available for a specific notification it will be left blank.
          </div>
        </div>
      )}
    </section>
  );
}
