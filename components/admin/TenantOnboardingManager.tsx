"use client";

import { useMemo, useState } from "react";

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: string | null;
  created_at: string | null;
};

type CreatedTenant = {
  tenant: TenantSummary;
  storefrontUrl: string;
  adminUrl: string;
  ownerCreated: boolean;
  checklist: string[];
};

type Props = {
  initialTenants: TenantSummary[];
  apiPath?: string;
  platformMode?: boolean;
};

const COUNTRY_OPTIONS = [
  { code: "GB", label: "United Kingdom", hint: "GBP / Stripe-friendly" },
  { code: "ZA", label: "South Africa", hint: "ZAR / Yoco-friendly" },
  { code: "KE", label: "Kenya", hint: "KES / Pesapal & M-Pesa-friendly" },
];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export default function TenantOnboardingManager({ initialTenants, apiPath = "/api/admin/tenants", platformMode = false }: Props) {
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [countryCode, setCountryCode] = useState("GB");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactWhatsApp, setContactWhatsApp] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [tenants, setTenants] = useState(initialTenants);
  const [created, setCreated] = useState<CreatedTenant | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [platformKey, setPlatformKey] = useState("");
  const [platformUnlocked, setPlatformUnlocked] = useState(false);

  const suggestedSlug = useMemo(() => slugify(businessName), [businessName]);
  const effectiveSlug = slugify(slug || suggestedSlug);
  const storefrontPreview = effectiveSlug ? `https://${effectiveSlug}.orduva.com` : "https://clientname.orduva.com";

  function updateBusinessName(value: string) {
    setBusinessName(value);
    if (!slug || slug === suggestedSlug) {
      setSlug(slugify(value));
    }
  }

  function platformHeaders() {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (platformMode) headers["x-orduva-platform-key"] = platformKey.trim();
    return headers;
  }

  async function loadPlatformTenants() {
    if (!platformMode) return;
    if (!platformKey.trim()) {
      setMessage("Enter the Orduva platform access key first.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(apiPath, { headers: platformHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to unlock platform onboarding");
      setTenants(data.tenants || []);
      setPlatformUnlocked(true);
      setMessage("Platform onboarding unlocked.");
    } catch (error) {
      setPlatformUnlocked(false);
      setMessage(error instanceof Error ? error.message : "Failed to unlock platform onboarding");
    } finally {
      setBusy(false);
    }
  }

  async function createTenant() {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    setCreated(null);

    try {
      if (platformMode && !platformKey.trim()) {
        throw new Error("Enter the Orduva platform access key first.");
      }

      const response = await fetch(apiPath, {
        method: "POST",
        headers: platformHeaders(),
        body: JSON.stringify({
          businessName,
          slug: effectiveSlug,
          countryCode,
          contactPhone,
          contactEmail,
          contactWhatsApp,
          ownerName,
          ownerEmail,
          ownerPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to create tenant");

      setCreated(data as CreatedTenant);
      setTenants((current) => [data.tenant, ...current.filter((tenant) => tenant.id !== data.tenant.id)]);
      setBusinessName("");
      setSlug("");
      setContactPhone("");
      setContactEmail("");
      setContactWhatsApp("");
      setOwnerName("");
      setOwnerEmail("");
      setOwnerPassword("");
      setMessage("Client tenant foundation created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create tenant");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {platformMode ? (
        <section className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_50px_rgba(14,14,16,0.08)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Platform access</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Unlock client onboarding</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Enter the Orduva platform access key before creating or viewing client tenant foundations. This keeps onboarding separate from the tenant admin area.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              value={platformKey}
              onChange={(event) => {
                setPlatformKey(event.target.value);
                setPlatformUnlocked(false);
              }}
              placeholder="Platform access key"
              className="min-h-12 flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            <button
              type="button"
              onClick={loadPlatformTenants}
              disabled={busy}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#252528] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {platformUnlocked ? "Unlocked" : busy ? "Checking..." : "Unlock"}
            </button>
          </div>
        </section>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Create client foundation</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">New client / tenant</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This creates the tenant record, default settings, starter category, subdomain preview, and optional owner login foundation.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Business name</span>
              <input
                value={businessName}
                onChange={(event) => updateBusinessName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="Example Café"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Storefront slug</span>
              <input
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="example-cafe"
              />
              <p className="mt-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
                Storefront preview: {storefrontPreview}
              </p>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Country / currency base</span>
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>{country.label} — {country.hint}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Phone</span>
              <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">WhatsApp</span>
              <input value={contactWhatsApp} onChange={(event) => setContactWhatsApp(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Contact email</span>
              <input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
            </label>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Optional owner login</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Add these now if you want a first owner login created for the new tenant.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" placeholder="Owner name" />
              <input value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" placeholder="Owner email" />
              <input value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} type="password" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 sm:col-span-2" placeholder="Temporary password, minimum 8 characters" />
            </div>
          </div>

          {message ? (
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.includes("Failed") || message.includes("required") || message.includes("reserved") || message.includes("already") ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {message}
            </div>
          ) : null}

          <button
            type="button"
            onClick={createTenant}
            disabled={busy || !businessName.trim() || !effectiveSlug || (platformMode && !platformKey.trim())}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Creating client..." : "Create client foundation"}
          </button>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Launch checklist</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">What this prepares</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {[
                "Tenant database record",
                "Default storefront settings",
                "Country-based currency defaults",
                "Starter menu category",
                "Optional owner login",
                "Subdomain storefront preview",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {created ? (
            <section className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Created</p>
              <h2 className="mt-2 text-xl font-bold">{created.tenant.name}</h2>
              <div className="mt-4 space-y-2 text-sm leading-6">
                <p><span className="font-semibold">Storefront:</span> {created.storefrontUrl}</p>
                <p><span className="font-semibold">Admin:</span> {created.adminUrl}</p>
                <p><span className="font-semibold">Owner login:</span> {created.ownerCreated ? "Created" : "Not created"}</p>
              </div>
              <div className="mt-4 space-y-2">
                {created.checklist.map((item) => (
                  <p key={item} className="rounded-xl bg-white/70 px-3 py-2 text-sm">• {item}</p>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      <section className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Recent tenants</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Client foundations</h2>
          </div>
          <p className="text-sm text-slate-500">Newest first</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">{tenant.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{tenant.slug}.orduva.com</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">{tenant.status || "active"}</span>
              </div>
            </div>
          ))}
          {!tenants.length ? <p className="text-sm text-slate-500">No tenants found yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
