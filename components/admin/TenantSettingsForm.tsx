"use client";

import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";
import { DEFAULT_MONEY_SETTINGS, formatMoney } from "@/lib/money";
import { buildThemeFromCore, normalizeThemeColor, type StorefrontTheme, type StorefrontThemeKey } from "@/lib/storefront-theme";

type FormState = {
  businessDisplayName: string;
  storefrontHeading: string;
  storefrontSubheading: string;
  adminHeadingLabel: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  backgroundTint: string;
  borderColor: string;
  textColor: string;
  storefrontTheme: StorefrontTheme | null;
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

type PreviewTarget = "global" | "header" | "welcome" | "products" | "footer";

type ThemePreset = {
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  backgroundTint: string;
  borderColor: string;
  textColor: string;
  theme: StorefrontTheme;
};

const THEME_PRESETS: ThemePreset[] = [
  makePreset("Premium Blue & Orange", "Clean, professional and tech-led.", "#336699", "#F28C28", "#F3F8FC", "#BED3E8", "#16283A"),
  makePreset("Forest Green & Gold", "Warm, natural and restaurant-friendly.", "#1F5C3B", "#D8A63A", "#F4F7EF", "#C9D8B8", "#1D2B22"),
  makePreset("Charcoal & Teal", "Modern, cool and premium.", "#263238", "#16A3A3", "#F2F6F6", "#B8D8D8", "#172326"),
  makePreset("Cream & Berry", "Soft, boutique and welcoming.", "#7A2E55", "#E0A458", "#FFF7EE", "#E8CDB7", "#35232B"),
];

const THEME_GROUPS: Array<{
  id: PreviewTarget;
  title: string;
  description: string;
  fields: Array<{ key: StorefrontThemeKey; label: string }>;
}> = [
  {
    id: "global",
    title: "Global",
    description: "The page canvas, general text and soft borders.",
    fields: [
      { key: "globalPageBackground", label: "Page background" },
      { key: "globalText", label: "Main text" },
      { key: "globalSoftText", label: "Soft text" },
      { key: "globalBorder", label: "General border" },
    ],
  },
  {
    id: "header",
    title: "Header",
    description: "The sticky storefront header and small action buttons.",
    fields: [
      { key: "headerBackground", label: "Header background" },
      { key: "headerText", label: "Header text" },
      { key: "headerButtonBorder", label: "Search/cart button edge" },
    ],
  },
  {
    id: "welcome",
    title: "Welcome Card",
    description: "The opening welcome panel customers see first.",
    fields: [
      { key: "welcomeBackground", label: "Card background" },
      { key: "welcomeLabel", label: "Welcome label" },
      { key: "welcomeHeading", label: "Heading" },
      { key: "welcomeBody", label: "Body text" },
      { key: "welcomeBorder", label: "Border" },
      { key: "welcomeShadow", label: "Soft shadow tint" },
    ],
  },
  {
    id: "products",
    title: "Product Cards",
    description: "Product card surfaces, titles, price box and Add/More buttons.",
    fields: [
      { key: "productCardBackground", label: "Card background" },
      { key: "productCardBorder", label: "Card border" },
      { key: "productTitle", label: "Product title" },
      { key: "priceBoxBackground", label: "Price background" },
      { key: "priceBoxBorder", label: "Price border" },
      { key: "priceText", label: "Price text" },
      { key: "addButtonBackground", label: "Add background" },
      { key: "addButtonBorder", label: "Add border" },
      { key: "addButtonText", label: "Add text" },
      { key: "moreButtonBackground", label: "More background" },
      { key: "moreButtonBorder", label: "More border" },
      { key: "moreButtonText", label: "More text" },
    ],
  },
  {
    id: "footer",
    title: "Footer",
    description: "Storefront footer and business details panel.",
    fields: [
      { key: "footerBackground", label: "Footer background" },
      { key: "footerText", label: "Footer text" },
      { key: "footerBadgeBackground", label: "Footer badge" },
    ],
  },
];

function makePreset(name: string, description: string, primaryColor: string, accentColor: string, backgroundTint: string, borderColor: string, textColor: string): ThemePreset {
  return {
    name,
    description,
    primaryColor,
    accentColor,
    backgroundTint,
    borderColor,
    textColor,
    theme: buildThemeFromCore({ primaryColor, accentColor, backgroundTint, borderColor, textColor, presetName: name }),
  };
}

function normaliseTheme(theme: StorefrontTheme | null | undefined, form: Pick<FormState, "primaryColor" | "accentColor" | "backgroundTint" | "borderColor" | "textColor">): StorefrontTheme {
  return {
    ...buildThemeFromCore({
      primaryColor: form.primaryColor,
      accentColor: form.accentColor,
      backgroundTint: form.backgroundTint,
      borderColor: form.borderColor,
      textColor: form.textColor,
    }),
    ...(theme || {}),
  };
}

export default function TenantSettingsForm({ initial, tenantName }: { initial: FormState; tenantName: string }) {
  const [form, setForm] = useState<FormState>({ ...initial, storefrontTheme: normaliseTheme(initial.storefrontTheme, initial) });
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"idle" | "success" | "error" | "info">("idle");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>("welcome");

  const theme = normaliseTheme(form.storefrontTheme, form);
  const previewName = form.businessDisplayName.trim() || tenantName;
  const previewHeading = form.storefrontHeading.trim() || "Browse the menu";
  const previewSubheading = form.storefrontSubheading.trim() || "Tap into the details for more information, or add favourites straight to your order.";
  const footerBlurb = form.footerBlurb.trim() || "Thank you for ordering with us.";
  const footerNotice = form.footerNotice.trim() || "Prices and availability may change without notice.";
  const moneySettings = {
    currencyName: form.currencyName.trim() || DEFAULT_MONEY_SETTINGS.currencyName,
    currencyCode: form.currencyCode.trim() || DEFAULT_MONEY_SETTINGS.currencyCode,
    currencySymbol: form.currencySymbol.trim() || DEFAULT_MONEY_SETTINGS.currencySymbol,
    currencyDisplayMode: form.currencyDisplayMode,
    currencySymbolPosition: form.currencySymbolPosition,
    currencyDecimalPlaces: Number(form.currencyDecimalPlaces || "0"),
    currencyUseThousandsSeparator: form.currencyUseThousandsSeparator,
    currencyDecimalSeparator: form.currencyDecimalSeparator || ".",
    currencyThousandsSeparator: form.currencyThousandsSeparator || ",",
    currencySuffix: form.currencySuffix,
  };

  const activePreset = THEME_PRESETS.find((preset) => theme.selectedPreset === preset.name);
  const messageClass = useMemo(() => {
    if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (tone === "error") return "border-rose-200 bg-rose-50 text-rose-800";
    if (tone === "info") return "border-orange-200 bg-orange-50 text-orange-900";
    return "hidden";
  }, [tone]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateThemeColor(key: StorefrontThemeKey, value: string) {
    const next = value.toUpperCase();
    setForm((current) => ({
      ...current,
      storefrontTheme: {
        ...normaliseTheme(current.storefrontTheme, current),
        [key]: next,
        customised: true,
      },
    }));
  }

  function applyThemePreset(preset: ThemePreset) {
    setForm((current) => ({
      ...current,
      primaryColor: preset.primaryColor,
      accentColor: preset.accentColor,
      backgroundTint: preset.backgroundTint,
      borderColor: preset.borderColor,
      textColor: preset.textColor,
      storefrontTheme: { ...preset.theme, selectedPreset: preset.name, customised: false },
    }));
    setPreviewTarget("welcome");
    setTone("info");
    setMessage(`Applied ${preset.name}. You can now fine-tune each storefront item before saving.`);
  }

  async function uploadAsset(file: File, kind: "logo" | "favicon") {
    const setUploading = kind === "logo" ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    setTone("info");
    setMessage(`Uploading ${kind}...`);

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const response = await fetch("/api/admin/upload-tenant-asset", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Failed to upload ${kind}`);
      update(kind === "logo" ? "logoUrl" : "faviconUrl", payload.url || "");
      setTone("success");
      setMessage(`${kind === "logo" ? "Logo" : "Favicon"} uploaded.`);
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error ? error.message : `Failed to upload ${kind}`);
    } finally {
      setUploading(false);
    }
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
        body: JSON.stringify({ ...form, storefrontTheme: theme }),
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
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={onSubmit} className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tenant settings</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Storefront branding and theme editor</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Choose a preset as a starting point, then fine-tune each visible storefront section with preview controls.
          </p>
        </div>

        <Section title="Branding and wording">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Business display name"><input value={form.businessDisplayName} onChange={(e) => update("businessDisplayName", e.target.value)} className="input" placeholder={tenantName} /></Field>
            <Field label="Admin heading label"><input value={form.adminHeadingLabel} onChange={(e) => update("adminHeadingLabel", e.target.value)} className="input" placeholder="Used in the admin shell" /></Field>
            <div className="md:col-span-2"><Field label="Storefront heading"><input value={form.storefrontHeading} onChange={(e) => update("storefrontHeading", e.target.value)} className="input" placeholder="Browse the menu" /></Field></div>
            <div className="md:col-span-2"><Field label="Storefront subheading"><textarea value={form.storefrontSubheading} onChange={(e) => update("storefrontSubheading", e.target.value)} rows={3} className="input" placeholder="A short welcome line for this business" /></Field></div>
            <div className="md:col-span-2"><Field label="Logo URL"><input value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} className="input" placeholder="https://..." /></Field></div>
            <div><UploadField label="Upload logo" busy={uploadingLogo} onFile={(file) => uploadAsset(file, "logo")} /></div>
            <div><UploadField label="Upload favicon" busy={uploadingFavicon} onFile={(file) => uploadAsset(file, "favicon")} /></div>
          </div>
        </Section>

        <Section title="Theme presets">
          <div className="mb-4 rounded-[22px] border border-orange-100 bg-orange-50/70 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Active preset: {activePreset ? `${activePreset.name}${theme.customised ? " — customised" : ""}` : "Custom"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">Selected presets now populate the full colour list below.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {THEME_PRESETS.map((preset) => {
              const selected = activePreset?.name === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyThemePreset(preset)}
                  className={`rounded-[20px] border bg-white p-3 text-left transition hover:-translate-y-[1px] ${selected ? "border-orange-400 ring-2 ring-orange-200" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {[preset.primaryColor, preset.accentColor, preset.backgroundTint, preset.borderColor, preset.textColor].map((color) => (
                        <span key={color} className="h-4 w-4 rounded-full border border-black/5" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                    {selected ? <span className="rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-800">✓ Active</span> : null}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{preset.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Per-item storefront colours">
          <div className="space-y-4">
            {THEME_GROUPS.map((group) => (
              <details key={group.id} className="rounded-[22px] border border-slate-200 bg-white p-4" open={group.id === "welcome" || group.id === "products"}>
                <summary className="cursor-pointer text-sm font-bold text-slate-900">
                  {group.title}
                  <span className="ml-2 text-xs font-normal text-slate-500">{group.description}</span>
                </summary>
                <div className="mt-4 space-y-3">
                  {group.fields.map((field) => (
                    <ColorRow
                      key={field.key}
                      label={field.label}
                      value={String(theme[field.key] || "#FFFFFF")}
                      onChange={(value) => updateThemeColor(field.key, value)}
                      onPreview={() => setPreviewTarget(group.id)}
                    />
                  ))}
                </div>
              </details>
            ))}
          </div>
        </Section>

        <Section title="Business contact details">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contact phone"><input value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className="input" placeholder="+254..." /></Field>
            <Field label="WhatsApp"><input value={form.contactWhatsApp} onChange={(e) => update("contactWhatsApp", e.target.value)} className="input" placeholder="+254..." /></Field>
            <Field label="Email"><input value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="input" placeholder="hello@example.com" /></Field>
            <Field label="Business address"><input value={form.contactAddress} onChange={(e) => update("contactAddress", e.target.value)} className="input" placeholder="Street, area, city" /></Field>
            <div className="md:col-span-2"><Field label="Footer blurb"><input value={form.footerBlurb} onChange={(e) => update("footerBlurb", e.target.value)} className="input" placeholder="Thank you for ordering with us." /></Field></div>
            <div className="md:col-span-2"><Field label="Footer notice"><input value={form.footerNotice} onChange={(e) => update("footerNotice", e.target.value)} className="input" placeholder="Prices and availability may change without notice." /></Field></div>
          </div>
        </Section>

        <Section title="Advanced currency display">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Currency name"><input value={form.currencyName} onChange={(e) => update("currencyName", e.target.value)} className="input" /></Field>
            <Field label="Currency code"><input value={form.currencyCode} onChange={(e) => update("currencyCode", e.target.value.toUpperCase())} className="input uppercase" maxLength={3} /></Field>
            <Field label="Symbol"><input value={form.currencySymbol} onChange={(e) => update("currencySymbol", e.target.value)} className="input" maxLength={12} /></Field>
            <Field label="Display mode"><select value={form.currencyDisplayMode} onChange={(e) => update("currencyDisplayMode", e.target.value as FormState["currencyDisplayMode"])} className="input"><option value="symbol">Symbol only</option><option value="code">Code only</option><option value="code_symbol">Code + symbol</option><option value="symbol_code">Symbol + code</option><option value="none">No prefix</option></select></Field>
            <Field label="Prefix position"><select value={form.currencySymbolPosition} onChange={(e) => update("currencySymbolPosition", e.target.value as FormState["currencySymbolPosition"])} className="input"><option value="before">Before amount</option><option value="after">After amount</option></select></Field>
            <Field label="Decimal places"><input type="number" min={0} max={4} value={form.currencyDecimalPlaces} onChange={(e) => update("currencyDecimalPlaces", e.target.value)} className="input" /></Field>
          </div>
          <label className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.currencyUseThousandsSeparator} onChange={(e) => update("currencyUseThousandsSeparator", e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            Use thousands separator
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[100, 295, 1000].map((amount) => (
              <div key={amount} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Sample</p>
                <p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(amount, moneySettings)}</p>
              </div>
            ))}
          </div>
        </Section>

        {message ? <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${messageClass}`}>{message}</div> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Preview uses the current draft colours before saving.</p>
          <button type="submit" disabled={saving} className="admin-pressable inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>

      <div className="space-y-5 xl:sticky xl:top-5 xl:self-start">
        <div className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live section preview</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">{labelForPreview(previewTarget)}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {THEME_GROUPS.map((group) => (
                <button key={group.id} type="button" onClick={() => setPreviewTarget(group.id)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${previewTarget === group.id ? "border-orange-300 bg-orange-50 text-orange-900" : "border-slate-200 bg-white text-slate-600"}`}>{group.title}</button>
              ))}
            </div>
          </div>

          <PreviewPanel
            target={previewTarget}
            theme={theme}
            previewName={previewName}
            previewHeading={previewHeading}
            previewSubheading={previewSubheading}
            footerBlurb={footerBlurb}
            footerNotice={footerNotice}
            money={formatMoney(295, moneySettings)}
          />
        </div>

        <div className="rounded-[30px] border border-orange-100 bg-orange-50 p-5 text-sm leading-6 text-orange-950 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
          Each colour row has a Preview button that jumps this panel to the relevant storefront section with your draft colour applied.
        </div>
      </div>
    </div>
  );
}

function labelForPreview(target: PreviewTarget) {
  if (target === "global") return "Global page";
  if (target === "header") return "Header";
  if (target === "welcome") return "Welcome card";
  if (target === "products") return "Product card";
  return "Footer";
}

function PreviewPanel({ target, theme, previewName, previewHeading, previewSubheading, footerBlurb, footerNotice, money }: { target: PreviewTarget; theme: StorefrontTheme; previewName: string; previewHeading: string; previewSubheading: string; footerBlurb: string; footerNotice: string; money: string }) {
  const background = normalizeThemeColor(theme.globalPageBackground, "#F8F4F0");
  const text = normalizeThemeColor(theme.globalText, "#2B2B2B");
  return (
    <div className="mt-5 rounded-[28px] border p-4" style={{ backgroundColor: background, borderColor: normalizeThemeColor(theme.globalBorder, "#D9C7A3"), color: text }}>
      {target === "global" ? <div className="rounded-[24px] border bg-white p-5" style={{ borderColor: normalizeThemeColor(theme.globalBorder, "#D9C7A3") }}><p className="text-sm font-bold">{previewName}</p><p className="mt-2 text-sm" style={{ color: normalizeThemeColor(theme.globalSoftText, "#64748B") }}>This shows the page background, main text and soft text treatment.</p></div> : null}
      {target === "header" ? <div className="rounded-[24px] border p-4" style={{ backgroundColor: normalizeThemeColor(theme.headerBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.headerButtonBorder, "#D9C7A3"), color: normalizeThemeColor(theme.headerText, "#2B2B2B") }}><div className="flex items-center justify-between"><strong>{previewName}</strong><div className="flex gap-2"><span className="rounded-xl border bg-white px-3 py-2 text-xs" style={{ borderColor: normalizeThemeColor(theme.headerButtonBorder, "#D9C7A3") }}>Search</span><span className="rounded-xl border bg-white px-3 py-2 text-xs" style={{ borderColor: normalizeThemeColor(theme.headerButtonBorder, "#D9C7A3") }}>Cart</span></div></div></div> : null}
      {target === "welcome" ? <div className="rounded-[24px] border p-5" style={{ backgroundColor: normalizeThemeColor(theme.welcomeBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.welcomeBorder, "#D9C7A3"), boxShadow: `0 16px 36px ${normalizeThemeColor(theme.welcomeShadow, "#D9C7A3")}22` }}><p className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: normalizeThemeColor(theme.welcomeLabel, "#C7922F") }}>Welcome</p><h4 className="mt-2 text-2xl font-bold" style={{ color: normalizeThemeColor(theme.welcomeHeading, "#0F172A") }}>{previewHeading}</h4><p className="mt-3 text-sm leading-6" style={{ color: normalizeThemeColor(theme.welcomeBody, "#2B2B2B") }}>{previewSubheading}</p></div> : null}
      {target === "products" ? <div className="rounded-[26px] border p-4" style={{ backgroundColor: normalizeThemeColor(theme.productCardBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.productCardBorder, "#D9C7A3") }}><div className="grid grid-cols-[6rem_1fr] gap-3"><div className="rounded-2xl bg-slate-100" /><div><h4 className="font-bold" style={{ color: normalizeThemeColor(theme.productTitle, "#0F172A") }}>Sample product</h4><div className="mt-4 grid grid-cols-3 gap-2"><span className="rounded-xl border px-2 py-2 text-center text-sm font-bold" style={{ backgroundColor: normalizeThemeColor(theme.priceBoxBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.priceBoxBorder, "#D9C7A3"), color: normalizeThemeColor(theme.priceText, "#0F172A") }}>{money}</span><span className="rounded-xl border px-2 py-2 text-center text-sm font-bold" style={{ backgroundColor: normalizeThemeColor(theme.addButtonBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.addButtonBorder, "#D9C7A3"), color: normalizeThemeColor(theme.addButtonText, "#0F172A") }}>Add</span><span className="rounded-xl border px-2 py-2 text-center text-sm font-bold" style={{ backgroundColor: normalizeThemeColor(theme.moreButtonBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.moreButtonBorder, "#D9C7A3"), color: normalizeThemeColor(theme.moreButtonText, "#0F172A") }}>More</span></div></div></div></div> : null}
      {target === "footer" ? <div className="rounded-[24px] border p-5" style={{ backgroundColor: normalizeThemeColor(theme.footerBackground, "#FFFFFF"), borderColor: normalizeThemeColor(theme.globalBorder, "#D9C7A3"), color: normalizeThemeColor(theme.footerText, "#2B2B2B") }}><p className="text-xs font-bold uppercase tracking-[0.2em]">Storefront footer</p><p className="mt-2 text-sm leading-6">{footerBlurb}</p><p className="mt-3 text-xs leading-5">{footerNotice}</p><span className="mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-bold text-white" style={{ backgroundColor: normalizeThemeColor(theme.footerBadgeBackground, "#C7922F") }}>Currency badge</span></div> : null}
    </div>
  );
}

function ColorRow({ label, value, onChange, onPreview }: { label: string; value: string; onChange: (value: string) => void; onPreview: () => void }) {
  return (
    <div className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:grid-cols-[1fr_130px_44px_92px] sm:items-center">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold uppercase outline-none focus:border-slate-400" />
      <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff"} onChange={(e) => onChange(e.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white p-1" aria-label={`${label} colour picker`} />
      <button type="button" onClick={onPreview} className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-bold text-orange-800 transition hover:bg-orange-50">Preview</button>
    </div>
  );
}

function UploadField({ label, busy, onFile }: { label: string; busy: boolean; onFile: (file: File) => void }) {
  return (
    <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <span className="font-semibold">{busy ? "Uploading..." : label}</span>
      <input type="file" accept="image/*" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) onFile(file); e.currentTarget.value = ""; }} className="mt-2 block w-full text-xs" />
    </label>
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
