"use client";

import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";

type FormState = {
  businessDisplayName: string;
  storefrontHeading: string;
  storefrontSubheading: string;
  adminHeadingLabel: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
};

export default function TenantSettingsForm({
  initial,
  tenantName,
}: {
  initial: FormState;
  tenantName: string;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"idle" | "success" | "error" | "info">("idle");
  const [saving, setSaving] = useState(false);

  const previewName = form.businessDisplayName.trim() || tenantName;
  const previewHeading = form.storefrontHeading.trim() || "Browse the menu";
  const previewSubheading =
    form.storefrontSubheading.trim() || "Tap into the details for more information, or add favourites straight to your order.";

  const messageClass = useMemo(() => {
    if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (tone === "error") return "border-rose-200 bg-rose-50 text-rose-800";
    if (tone === "info") return "border-slate-200 bg-slate-50 text-slate-700";
    return "hidden";
  }, [tone]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setTone("info");
    setMessage("Saving tenant branding settings...");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save settings");
      setTone("success");
      setMessage("Tenant branding settings saved.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <form onSubmit={onSubmit} className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tenant branding</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Business identity and storefront wording</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This is the first branding/settings layer. It lets each tenant start reflecting its own name, header copy, and colour direction.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Business display name">
            <input value={form.businessDisplayName} onChange={(e) => update("businessDisplayName", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder={tenantName} />
          </Field>
          <Field label="Admin heading label">
            <input value={form.adminHeadingLabel} onChange={(e) => update("adminHeadingLabel", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="Used in the admin shell" />
          </Field>
          <div className="md:col-span-2">
            <Field label="Storefront heading">
              <input value={form.storefrontHeading} onChange={(e) => update("storefrontHeading", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="Browse the menu" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Storefront subheading">
              <textarea value={form.storefrontSubheading} onChange={(e) => update("storefrontSubheading", e.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="A short welcome line for this business" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Logo URL">
              <input value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="https://..." />
            </Field>
          </div>
          <Field label="Primary brand colour">
            <input value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-400" placeholder="#0F172A" />
          </Field>
          <Field label="Accent brand colour">
            <input value={form.accentColor} onChange={(e) => update("accentColor", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-400" placeholder="#10B981" />
          </Field>
        </div>

        {message ? <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${messageClass}`}>{message}</div> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">This safely leaves the accepted product card layout untouched.</p>
          <button type="submit" disabled={saving} className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>

      <div className="space-y-5">
        <div className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Storefront preview</p>
          <div className="mt-4 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.99),rgba(244,248,244,0.97))] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.07)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm overflow-hidden">
                {form.logoUrl.trim() ? <img src={form.logoUrl.trim()} alt={previewName} className="h-full w-full rounded-[18px] object-cover" /> : "Logo"}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Order online</p>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{previewName}</h3>
              </div>
            </div>
            <div className="mt-5 rounded-[24px] border p-5" style={{ borderColor: form.accentColor || "#10B981" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Welcome</p>
              <h4 className="mt-2 text-3xl font-semibold" style={{ color: form.primaryColor || "#0F172A" }}>{previewHeading}</h4>
              <p className="mt-3 text-sm leading-6 text-slate-600">{previewSubheading}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-sky-100 bg-sky-50 p-5 text-sm leading-6 text-sky-900 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
          This is the first real tenant settings layer. After this, the next good expansion is contact details, footer info, social links, and customer-facing business details.
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
