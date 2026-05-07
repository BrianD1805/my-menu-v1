"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";

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
  emailNotifications?: Record<string, unknown>;
  checklist: string[];
};

type Props = {
  initialTenants: TenantSummary[];
  apiPath?: string;
  platformMode?: boolean;
  clientMode?: boolean;
};

const RESERVED_SLUGS = new Set(["admin", "api", "app", "assets", "static", "www", "orduva", "zimzaexpress", "zimza-express", "localhost", "support", "help", "login", "platform"]);

const COUNTRY_OPTIONS = [
  { code: "GB", label: "United Kingdom", hint: "GBP / Stripe-friendly" },
  { code: "ZA", label: "South Africa", hint: "ZAR / Yoco-friendly" },
  { code: "KE", label: "Kenya", hint: "KES / Pesapal & M-Pesa-friendly" },
];

const PRE_LAUNCH_STEPS = [
  "Create store foundation and starter Menu category",
  "Open the generated store address",
  "Open shared admin and confirm the active store",
  "Upload logo and favicon",
  "Review storefront colours and currency formatting",
  "Add real categories and products",
  "Enable admin push notifications",
  "Place a test order from the store address",
  "Change the order status and confirm customer push updates",
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

function looksLikeEmail(value: string) {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function buildStoreAddress(slug: string) {
  return `https://${slug}.orduva.com`;
}

function buildAdminLoginUrl(slug: string) {
  return `/admin/login?tenant=${encodeURIComponent(slug)}`;
}

function buildPublicAdminLoginUrl(slug: string) {
  return `https://admin.orduva.com/admin/login?tenant=${encodeURIComponent(slug)}`;
}

export default function TenantOnboardingManager({ initialTenants, apiPath = "/api/admin/tenants", platformMode = false, clientMode = false }: Props) {
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
  const [website, setWebsite] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [humanConfirmed, setHumanConfirmed] = useState(false);
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [refTenant, setRefTenant] = useState("");
  const [refSource, setRefSource] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [refLandingUrl, setRefLandingUrl] = useState("");
  const ownerAccess = useOwnerPlatformAccess();
  const autoLoadedOwnerTenants = useRef(false);

  const suggestedSlug = useMemo(() => slugify(businessName), [businessName]);
  const effectiveSlug = slugify(slug || suggestedSlug);
  const storefrontPreview = effectiveSlug ? `https://${effectiveSlug}.orduva.com` : "https://clientname.orduva.com";
  const adminPreview = "https://admin.orduva.com/admin";
  const duplicateSlug = tenants.some((tenant) => tenant.slug === effectiveSlug);
  const reservedSlug = RESERVED_SLUGS.has(effectiveSlug);
  const ownerDashboard = useMemo(() => {
    const totalStores = tenants.length;
    const setupStores = tenants.filter((tenant) => (tenant.status || "").toLowerCase() === "setup").length;
    const activeStores = tenants.filter((tenant) => (tenant.status || "").toLowerCase() === "active").length;
    const latestStore = tenants[0] || null;
    const createdThisWeek = tenants.filter((tenant) => {
      if (!tenant.created_at) return false;
      const createdAt = new Date(tenant.created_at).getTime();
      if (Number.isNaN(createdAt)) return false;
      return Date.now() - createdAt <= 7 * 24 * 60 * 60 * 1000;
    }).length;

    return { totalStores, setupStores, activeStores, latestStore, createdThisWeek };
  }, [tenants]);
  const invalidContactEmail = !looksLikeEmail(contactEmail);
  const invalidOwnerEmail = !looksLikeEmail(ownerEmail);
  const incompleteOwnerLogin = clientMode
    ? (!ownerName.trim() || !ownerEmail.trim() || ownerPassword.length < 8)
    : Boolean(ownerEmail.trim() || ownerPassword.trim() || ownerName.trim()) && (!ownerEmail.trim() || ownerPassword.length < 8);
  const ownerFacing = platformMode && !clientMode;
  const ownerGateUnlocked = ownerFacing && ownerAccess.unlocked && Boolean(ownerAccess.platformKey);
  const effectivePlatformKey = ownerGateUnlocked ? ownerAccess.platformKey : platformKey;

  const formWarnings = [
    !businessName.trim() ? "Business name is required." : null,
    !effectiveSlug || effectiveSlug.length < 3 ? "Store address name must be at least 3 characters." : null,
    reservedSlug ? "That store address is reserved for Orduva platform routing. Please choose another." : null,
    duplicateSlug ? "That store address is already listed in recent stores. Choose another before creating." : null,
    invalidContactEmail ? "Contact email does not look valid." : null,
    invalidOwnerEmail ? "Owner email does not look valid." : null,
    incompleteOwnerLogin ? (clientMode ? "Your owner login needs your name, email and a password of at least 8 characters." : "Owner login needs an owner email and a temporary password of at least 8 characters.") : null,
    clientMode && !humanConfirmed ? "Please confirm you are creating a genuine business store." : null,
    clientMode && !acceptedTerms ? "Please accept the Orduva terms before creating your store." : null,
    clientMode && !privacyAccepted ? "Please confirm Orduva can use these details to create and manage your store." : null,
  ].filter(Boolean) as string[];

  function updateBusinessName(value: string) {
    setBusinessName(value);
    if (!slug || slug === suggestedSlug) {
      setSlug(slugify(value));
    }
  }

  function platformHeaders() {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (platformMode && !clientMode) {
      headers["x-orduva-platform-key"] = effectivePlatformKey.trim();
      if (ownerAccess.platformSessionToken) headers["x-orduva-platform-2fa-session"] = ownerAccess.platformSessionToken;
    }
    return headers;
  }

  async function loadPlatformTenants() {
    if (!platformMode) return;
    if (!effectivePlatformKey.trim()) {
      setMessage("Unlock the Orduva owner platform first.");
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
      setMessage(clientMode ? "Onboarding unlocked. You can now complete your store setup request." : "Controlled onboarding unlocked. Recent store addresses are now checked before launch.");
    } catch (error) {
      setPlatformUnlocked(false);
      setMessage(error instanceof Error ? error.message : "Failed to unlock platform onboarding");
    } finally {
      setBusy(false);
    }
  }


  useEffect(() => {
    if (!clientMode || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const incomingRefTenant = (params.get("ref_tenant") || params.get("refTenant") || "").trim().toLowerCase();
    const incomingRefSource = (params.get("ref_source") || params.get("refSource") || "").trim();
    const incomingReferralCode = (params.get("ref") || params.get("referralCode") || "").trim().toLowerCase();

    if (incomingRefTenant) window.sessionStorage.setItem("orduva_ref_tenant", incomingRefTenant);
    if (incomingRefSource) window.sessionStorage.setItem("orduva_ref_source", incomingRefSource);
    if (incomingReferralCode) window.sessionStorage.setItem("orduva_ref_code", incomingReferralCode);
    if (incomingRefTenant || incomingReferralCode) window.sessionStorage.setItem("orduva_ref_landing_url", window.location.href);

    setRefTenant(incomingRefTenant || window.sessionStorage.getItem("orduva_ref_tenant") || "");
    setRefSource(incomingRefSource || window.sessionStorage.getItem("orduva_ref_source") || "");
    setReferralCode(incomingReferralCode || window.sessionStorage.getItem("orduva_ref_code") || "");
    setRefLandingUrl(window.sessionStorage.getItem("orduva_ref_landing_url") || window.location.href);
  }, [clientMode]);

  useEffect(() => {
    if (!ownerGateUnlocked || autoLoadedOwnerTenants.current) return;
    autoLoadedOwnerTenants.current = true;
    loadPlatformTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerGateUnlocked, ownerAccess.platformKey]);

  async function createTenant() {
    if (busy) return;
    if (formWarnings.length) {
      setMessage(formWarnings[0]);
      return;
    }
    setBusy(true);
    setMessage(null);
    setCreated(null);

    try {
      if (platformMode && !clientMode && !effectivePlatformKey.trim()) {
        throw new Error("Unlock the Orduva owner platform first.");
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
          website,
          acceptedTerms,
          privacyAccepted,
          humanConfirmed,
          formStartedAt,
          refTenant,
          refSource,
          referralCode,
          refLandingUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to create store");

      const createdTenant = data as CreatedTenant;
      setCreated(createdTenant);
      setTenants((current) => [createdTenant.tenant, ...current.filter((tenant) => tenant.id !== createdTenant.tenant.id)]);

      if (clientMode && typeof window !== "undefined") {
        if (refTenant || referralCode) {
          window.sessionStorage.removeItem("orduva_ref_tenant");
          window.sessionStorage.removeItem("orduva_ref_source");
          window.sessionStorage.removeItem("orduva_ref_code");
          window.sessionStorage.removeItem("orduva_ref_landing_url");
        }
        const params = new URLSearchParams({
          name: createdTenant.tenant.name,
          slug: createdTenant.tenant.slug,
          ownerCreated: createdTenant.ownerCreated ? "1" : "0",
          email: typeof createdTenant.emailNotifications?.client === "string" ? createdTenant.emailNotifications.client : "queued",
        });
        window.location.assign(`/start-your-store/success?${params.toString()}`);
        return;
      }

      setBusinessName("");
      setSlug("");
      setContactPhone("");
      setContactEmail("");
      setContactWhatsApp("");
      setOwnerName("");
      setOwnerEmail("");
      setOwnerPassword("");
      setWebsite("");
      setAcceptedTerms(false);
      setPrivacyAccepted(false);
      setHumanConfirmed(false);
      setFormStartedAt(Date.now());
      setRefTenant("");
      setRefSource("");
      setReferralCode("");
      setRefLandingUrl("");
      setMessage(clientMode ? "Your Orduva store has been created. Follow the next steps below to finish your setup." : "Client store foundation created. Use the launch links and checklist on the right.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to create store");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {platformMode && !clientMode && !ownerGateUnlocked ? (
        <section className="rounded-[30px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_50px_rgba(14,14,16,0.08)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Owner onboarding access</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Unlock store creation</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">This owner-only area requires the Orduva platform access key before creating or reviewing client store foundations.</p>
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
              {platformUnlocked ? "Unlocked" : busy ? "Checking..." : "Unlock onboarding"}
            </button>
          </div>
        </section>
      ) : null}

      {ownerFacing ? (
        <section className="rounded-[30px] border border-[#0E0E10]/10 bg-[#0E0E10] p-5 text-white shadow-[0_22px_60px_rgba(14,14,16,0.18)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFB168]">Owner dashboard</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Multi-store overview</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Quick owner view for onboarded stores, setup status and launch checks before you jump into a specific store admin. This owner platform remains separate from the public client onboarding flow.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/80">
              {platformUnlocked ? "Platform store list unlocked" : "Unlock to load live store list"}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Stores loaded</p>
              <p className="mt-2 text-3xl font-black">{ownerDashboard.totalStores}</p>
              <p className="mt-1 text-xs text-white/60">Newest stores appear below.</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">In setup</p>
              <p className="mt-2 text-3xl font-black">{ownerDashboard.setupStores}</p>
              <p className="mt-1 text-xs text-white/60">Needs launch checklist review.</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Active</p>
              <p className="mt-2 text-3xl font-black">{ownerDashboard.activeStores}</p>
              <p className="mt-1 text-xs text-white/60">Marked active in Supabase.</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Added this week</p>
              <p className="mt-2 text-3xl font-black">{ownerDashboard.createdThisWeek}</p>
              <p className="mt-1 text-xs text-white/60">Based on tenant created date.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB168]">Latest store</p>
              {ownerDashboard.latestStore ? (
                <>
                  <h3 className="mt-2 text-xl font-black">{ownerDashboard.latestStore.name}</h3>
                  <a href={buildStoreAddress(ownerDashboard.latestStore.slug)} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm font-bold text-[#FFB168] hover:text-white">
                    {ownerDashboard.latestStore.slug}.orduva.com
                  </a>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <a href={buildStoreAddress(ownerDashboard.latestStore.slug)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-white px-4 py-2 text-xs font-black text-[#0E0E10] transition hover:bg-[#FFF7F0]">Open storefront</a>
                    <a href={buildAdminLoginUrl(ownerDashboard.latestStore.slug)} className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/20">Open admin login</a>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm leading-6 text-white/70">No stores loaded yet. Unlock the platform list to view the latest onboarded client.</p>
              )}
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FFB168]">Owner quick checks</p>
              <div className="mt-3 grid gap-2 text-sm leading-6 text-white/80 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 px-4 py-3">Confirm the store address opens on the wildcard subdomain.</div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">Open admin login and confirm the Active store bar is correct.</div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">Check logo, favicon, colours and currency before demoing.</div>
                <div className="rounded-2xl bg-white/10 px-4 py-3">Place one test order and verify admin/customer push paths.</div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{clientMode ? "Client store setup" : "Create client foundation"}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{clientMode ? "Tell us about your store" : "New client store"}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {clientMode ? "Complete the details below. Your store address and owner login will be created automatically, then you can start setting up your menu and branding." : "This creates the store record, default settings, starter category, generated store address, and optional owner login foundation."}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Business name</span>
              <input
                value={businessName}
                onChange={(event) => updateBusinessName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                placeholder="Stamps Delivered"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Store address</span>
              <input
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${reservedSlug || duplicateSlug ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"}`}
                placeholder="stamps-delivered"
              />
              <div className="mt-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-950">
                <p className="font-semibold">Storefront preview: {storefrontPreview}</p>
                <p className="mt-1 text-xs leading-5 text-blue-900/75">Reserved store addresses blocked: admin, www, api, assets, static, platform, support, help and login.</p>
              </div>
              {reservedSlug || duplicateSlug ? (
                <p className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                  {reservedSlug ? "This store address is reserved for Orduva itself." : "This store address already appears in your recent store list."}
                </p>
              ) : null}
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
              <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" placeholder="Client phone" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">WhatsApp</span>
              <input value={contactWhatsApp} onChange={(event) => setContactWhatsApp(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" placeholder="Order WhatsApp number" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Contact email</span>
              <input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${invalidContactEmail ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"}`} placeholder="client@example.com" />
            </label>
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{clientMode ? "Store owner login" : "Optional owner login"}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{clientMode ? "Create your store owner login now. You will use this to manage your products, orders, branding and launch setup." : "Add these now if you want a first owner login created for the new store. Leave all three blank to skip."}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" placeholder={clientMode ? "Your name" : "Owner name"} />
              <input value={ownerEmail} onChange={(event) => setOwnerEmail(event.target.value)} className={`rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 ${invalidOwnerEmail ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"}`} placeholder={clientMode ? "Your email" : "Owner email"} />
              <input value={ownerPassword} onChange={(event) => setOwnerPassword(event.target.value)} type="password" className={`rounded-2xl border px-4 py-3 text-sm outline-none transition focus:ring-2 sm:col-span-2 ${incompleteOwnerLogin ? "border-rose-300 bg-rose-50 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-slate-400 focus:ring-slate-100"}`} placeholder={clientMode ? "Create password, minimum 8 characters" : "Temporary password, minimum 8 characters"} />
            </div>
          </div>

          {clientMode ? (
            <div className="mt-6 rounded-[24px] border border-[#FFB168]/40 bg-[#FFF7F0] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Trust, terms and launch protection</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Orduva will create a real store address and admin login from these details. This setup step does not take payment; the store starts with a 7-day Orduva trial.</p>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <label className="flex gap-3 rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
                  <input type="checkbox" checked={humanConfirmed} onChange={(event) => setHumanConfirmed(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                  <span>I am creating a genuine business store and not submitting spam or test data.</span>
                </label>
                <label className="flex gap-3 rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
                  <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                  <span>I accept Orduva&apos;s basic service terms: I will use the store responsibly, add accurate business/product details, and understand Orduva may suspend abusive or misleading stores.</span>
                </label>
                <label className="flex gap-3 rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm">
                  <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                  <span>I agree that Orduva can use the details I submit to create my store, owner login, storefront, and setup records.</span>
                </label>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">Spam protection is active. Submissions that look automated, too fast, or repeated too often may be blocked.</p>
            </div>
          ) : null}


          {clientMode && refTenant ? (
            <div className="mt-5 rounded-[22px] border border-[#FF6A3D]/20 bg-[#FFF7F0] px-4 py-3 text-sm leading-6 text-[#5C5F66]">
              <p className="font-black text-[#0E0E10]">Referral applied</p>
              <p className="mt-1">You arrived from an Orduva store link. If your store becomes a paying subscription, the referring store can be credited under the Orduva referral programme.</p>
            </div>
          ) : null}

          {formWarnings.length ? (
            <div className="mt-5 space-y-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-bold">Before creating this store:</p>
              {formWarnings.map((warning) => <p key={warning}>• {warning}</p>)}
            </div>
          ) : null}

          {message ? (
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${message.includes("Failed") || message.includes("required") || message.includes("reserved") || message.includes("already") || message.includes("valid") || message.includes("password") ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
              {message}
            </div>
          ) : null}

          {clientMode ? (
            <label className="hidden" aria-hidden="true">
              Website
              <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
            </label>
          ) : null}

          <button
            type="button"
            onClick={createTenant}
            disabled={busy || formWarnings.length > 0 || (platformMode && !clientMode && !effectivePlatformKey.trim())}
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_rgba(15,23,42,0.16)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {busy ? "Creating store..." : clientMode ? "Create my Orduva store" : "Create client foundation"}
          </button>
        </section>

        <aside className="space-y-5">
          {created ? (
            <section className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Your store is ready</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{created.tenant.name}</h2>
              <p className="mt-2 text-sm leading-6 text-emerald-900/80">Your Orduva store foundation has been created. Keep this page open for a moment and use the steps below to finish your launch setup.</p>
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm leading-6">
                <p><span className="font-semibold">Store address:</span> <span className="break-all">{created.tenant.slug}.orduva.com</span></p>
                <p><span className="font-semibold">Owner login:</span> {created.ownerCreated ? "Created from the details you entered" : "Not created"}</p>
                {clientMode ? (
                  <p><span className="font-semibold">Launch email:</span> {created.emailNotifications?.client === "sent" ? "Sent to your owner email" : created.emailNotifications?.client === "skipped_email_not_configured" ? "Ready once Orduva email is connected" : created.emailNotifications?.client === "failed" ? "Could not send automatically — keep these links safe" : "Queued where email is configured"}</p>
                ) : null}
              </div>
              <div className="mt-5 grid gap-3">
                <a href={created.storefrontUrl} target="_blank" rel="noreferrer" className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  1. View your new store →
                  <span className="mt-1 block break-all text-xs font-semibold text-emerald-800/75">{created.storefrontUrl}</span>
                </a>
                <a href={buildPublicAdminLoginUrl(created.tenant.slug)} target="_blank" rel="noreferrer" className="rounded-2xl bg-[#0E0E10] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  2. Sign in to manage your store →
                  <span className="mt-1 block break-all text-xs font-semibold text-white/70">{`admin.orduva.com/admin/login?tenant=${created.tenant.slug}`}</span>
                </a>
              </div>
              {clientMode ? (
                <div className="mt-5 rounded-[24px] border border-emerald-200 bg-white/80 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">What to do next</p>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-emerald-950">
                    <p><span className="font-black">1.</span> Keep the launch email and this page open while you finish setup.</p>
                    <p><span className="font-black">2.</span> Open your store address and check the starter store loads.</p>
                    <p><span className="font-black">3.</span> Sign in to admin using the owner email and password you just created.</p>
                    <p><span className="font-black">4.</span> Add your real categories, products, prices and product photos.</p>
                    <p><span className="font-black">5.</span> Upload your logo, check your colours, and confirm your currency looks right.</p>
                    <p><span className="font-black">6.</span> Place one test order before sharing your store address with customers.</p>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{clientMode ? "Setup guide" : "Launch checklist"}</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{clientMode ? "Your first setup steps" : "Store go-live steps"}</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
              {(created?.checklist?.length ? created.checklist : PRE_LAUNCH_STEPS).map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${created && index === 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>{created && index === 0 ? "✓" : index + 1}</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {ownerFacing ? (
      <section id="store-switcher" className="scroll-mt-6 rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Owner store switcher</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">Client stores</h2>
          </div>
          <p className="text-sm text-slate-500">Newest first · {ownerDashboard.totalStores} loaded</p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900">{tenant.name}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Store address</p>
                  <a href={buildStoreAddress(tenant.slug)} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-sm font-semibold text-blue-700 hover:text-blue-900">{tenant.slug}.orduva.com</a>
                </div>
                <span className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">{tenant.status || "active"}</span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a href={buildStoreAddress(tenant.slug)} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-100">
                  Open storefront
                </a>
                <a href={buildAdminLoginUrl(tenant.slug)} className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800">
                  Switch to this store admin
                </a>
              </div>
              <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-xs leading-5 text-slate-600">
                <p><span className="font-bold text-slate-800">Quick checks:</span> storefront opens, active store bar is correct, launch checklist is complete.</p>
                <p>Switcher foundation only: this opens the admin login with this store address prefilled. You still sign in as that store owner before editing anything.</p>
              </div>
            </div>
          ))}
          {!tenants.length ? <p className="text-sm text-slate-500">No stores found yet.</p> : null}
        </div>
      </section>
      ) : null}
    </div>
  );
}
