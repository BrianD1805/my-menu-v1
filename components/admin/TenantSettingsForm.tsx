"use client";

import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";
import { formatMoney } from "@/lib/money";

type FormState = {
  businessDisplayName: string;
  storefrontHeading: string;
  storefrontSubheading: string;
  adminHeadingLabel: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsApp: string;
  contactAddress: string;
  footerBlurb: string;
  footerNotice: string;
  currencyName: string;
  currencyCode: string;
  currencySymbol: string;
  currencyDisplayMode: "symbol" | "code" | "code_symbol" | "symbol_code" | "none";
  currencySymbolPosition: "before" | "after";
  currencyDecimalPlaces: string;
  currencyUseThousandsSeparator: boolean;
  currencyDecimalSeparator: string;
  currencyThousandsSeparator: string;
  currencySuffix: string;
};

export default function TenantSettingsForm({ initial, tenantName }: { initial: FormState; tenantName: string }) {
  const [form, setForm] = useState<FormState>(initial);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"idle" | "success" | "error" | "info">("idle");
  const [saving, setSaving] = useState(false);

  const previewName = form.businessDisplayName.trim() || tenantName;
  const previewHeading = form.storefrontHeading.trim() || "Browse the menu";
  const previewSubheading = form.storefrontSubheading.trim() || "Tap into the details for more information, or add favourites straight to your order.";
  const footerBlurb = form.footerBlurb.trim() || "Thank you for ordering with us.";
  const footerNotice = form.footerNotice.trim() || "Prices and availability may change without notice.";
  const moneySettings = {
    currencyName: form.currencyName.trim() || "Pounds Sterling",
    currencyCode: form.currencyCode.trim() || "GBP",
    currencySymbol: form.currencySymbol.trim() || "£",
    currencyDisplayMode: form.currencyDisplayMode,
    currencySymbolPosition: form.currencySymbolPosition,
    currencyDecimalPlaces: Number(form.currencyDecimalPlaces || "0"),
    currencyUseThousandsSeparator: form.currencyUseThousandsSeparator,
    currencyDecimalSeparator: form.currencyDecimalSeparator || ".",
    currencyThousandsSeparator: form.currencyThousandsSeparator || ",",
    currencySuffix: form.currencySuffix,
  };

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
    setMessage("Saving tenant settings...");

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Failed to save settings");
      setTone("success");
      setMessage("Tenant settings saved.");
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tenant settings</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Branding, contact, footer, and advanced currency</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Each tenant can now shape its own business identity, contact details, storefront footer details, and advanced currency display.
          </p>
        </div>

        <Section title="Branding and wording">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business display name"><input value={form.businessDisplayName} onChange={(e) => update("businessDisplayName", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder={tenantName} /></Field>
            <Field label="Admin heading label"><input value={form.adminHeadingLabel} onChange={(e) => update("adminHeadingLabel", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="Used in the admin shell" /></Field>
            <div className="md:col-span-2"><Field label="Storefront heading"><input value={form.storefrontHeading} onChange={(e) => update("storefrontHeading", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="Browse the menu" /></Field></div>
            <div className="md:col-span-2"><Field label="Storefront subheading"><textarea value={form.storefrontSubheading} onChange={(e) => update("storefrontSubheading", e.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="A short welcome line for this business" /></Field></div>
            <div className="md:col-span-2"><Field label="Logo URL"><input value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="https://..." /></Field></div>
            <Field label="Primary brand colour"><input value={form.primaryColor} onChange={(e) => update("primaryColor", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 uppercase" placeholder="#0F172A" /></Field>
            <Field label="Accent brand colour"><input value={form.accentColor} onChange={(e) => update("accentColor", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 uppercase" placeholder="#10B981" /></Field>
          </div>
        </Section>

        <Section title="Business contact details">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contact phone"><input value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="Main business phone" /></Field>
            <Field label="Contact email"><input value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="orders@example.com" /></Field>
            <Field label="Contact WhatsApp"><input value={form.contactWhatsApp} onChange={(e) => update("contactWhatsApp", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="WhatsApp number for customers" /></Field>
            <Field label="Business address"><input value={form.contactAddress} onChange={(e) => update("contactAddress", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="Street, area, city" /></Field>
          </div>
        </Section>

        <Section title="Storefront footer info">
          <div className="grid gap-4">
            <Field label="Footer blurb"><textarea value={form.footerBlurb} onChange={(e) => update("footerBlurb", e.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="A friendly closing line for the storefront footer" /></Field>
            <Field label="Footer notice"><textarea value={form.footerNotice} onChange={(e) => update("footerNotice", e.target.value)} rows={3} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="Useful notice such as delivery area, pricing, or availability note" /></Field>
          </div>
        </Section>

        <Section title="Currency display">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Currency name"><input value={form.currencyName} onChange={(e) => update("currencyName", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="Pounds Sterling" /></Field>
            <Field label="Currency code"><input value={form.currencyCode} onChange={(e) => update("currencyCode", e.target.value.toUpperCase())} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 uppercase" placeholder="GBP" maxLength={3} /></Field>
            <Field label="Currency symbol"><input value={form.currencySymbol} onChange={(e) => update("currencySymbol", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="£" maxLength={12} /></Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Display mode">
              <select value={form.currencyDisplayMode} onChange={(e) => update("currencyDisplayMode", e.target.value as FormState["currencyDisplayMode"])} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400">
                <option value="symbol">Symbol only</option>
                <option value="code">Code only</option>
                <option value="code_symbol">Code + symbol</option>
                <option value="symbol_code">Symbol + code</option>
                <option value="none">No prefix</option>
              </select>
            </Field>
            <Field label="Prefix position">
              <select value={form.currencySymbolPosition} onChange={(e) => update("currencySymbolPosition", e.target.value as FormState["currencySymbolPosition"])} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400">
                <option value="before">Before amount</option>
                <option value="after">After amount</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Field label="Decimal places"><input type="number" min={0} max={4} value={form.currencyDecimalPlaces} onChange={(e) => update("currencyDecimalPlaces", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" /></Field>
            <Field label="Decimal separator"><input value={form.currencyDecimalSeparator} onChange={(e) => update("currencyDecimalSeparator", e.target.value.slice(0, 1))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="." maxLength={1} /></Field>
            <Field label="Thousands separator"><input value={form.currencyThousandsSeparator} onChange={(e) => update("currencyThousandsSeparator", e.target.value.slice(0, 1))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="," maxLength={1} /></Field>
            <Field label="Suffix"><input value={form.currencySuffix} onChange={(e) => update("currencySuffix", e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400" placeholder="/-" maxLength={12} /></Field>
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.currencyUseThousandsSeparator} onChange={(e) => update("currencyUseThousandsSeparator", e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Use thousands separator
          </label>
        </Section>

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
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm">
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
            <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Footer</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{footerBlurb}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-600">
                {form.contactPhone.trim() ? <p>Phone: {form.contactPhone}</p> : null}
                {form.contactEmail.trim() ? <p>Email: {form.contactEmail}</p> : null}
                {form.contactAddress.trim() ? <p>Address: {form.contactAddress}</p> : null}
              </div>
              <div className="mt-4 grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-2">
                <span className="rounded-full bg-slate-100 px-3 py-1.5">{moneySettings.currencyCode}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 normal-case tracking-normal">100 → {formatMoney(100, moneySettings)}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 normal-case tracking-normal">1000 → {formatMoney(1000, moneySettings)}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 normal-case tracking-normal">295 → {formatMoney(295, moneySettings)}</span>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">{footerNotice}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-sky-100 bg-sky-50 p-5 text-sm leading-6 text-sky-900 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
          This tenant settings layer now covers branding, contact details, storefront footer content, and advanced currency display including code, symbol, suffix, decimal, and thousands separator control.
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6 rounded-[24px] border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">{title}</h3>
      {children}
    </section>
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
