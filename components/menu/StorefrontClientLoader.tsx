"use client";

import { useEffect, useMemo, useState } from "react";
import MenuBrowser from "@/components/menu/MenuBrowser";
import type { Category, Product } from "@/lib/types";
import type { StorefrontTheme } from "@/lib/storefront-theme";

type StorefrontSettings = {
  tenantId: string;
  tenantName: string;
  displayName: string;
  logoUrl: string | null;
  storefrontHeading: string;
  storefrontSubheading: string;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsApp: string | null;
  contactAddress: string | null;
  footerBlurb: string | null;
  footerNotice: string | null;
  showOrduvaReferralAd?: boolean | null;
  socialFacebookUrl: string | null;
  socialInstagramUrl: string | null;
  socialTikTokUrl: string | null;
  socialXUrl: string | null;
  socialWebsiteUrl: string | null;
  primaryColor: string;
  accentColor: string;
  backgroundTint: string;
  borderColor: string;
  textColor: string;
  currencyName: string;
  currencyCode: string;
  currencySymbol: string;
  currencyDisplayMode: "symbol" | "code" | "code_symbol" | "symbol_code" | "none";
  currencySymbolPosition: "before" | "after";
  currencyDecimalPlaces: number;
  currencyUseThousandsSeparator: boolean;
  currencyDecimalSeparator: string;
  currencyThousandsSeparator: string;
  currencySuffix: string;
  storefrontTheme: StorefrontTheme | null;
  trialState?: { checkoutBlocked?: boolean; isTrialExpired?: boolean; customerMessage?: string | null; trialEndsAt?: string | null } | null;
};

type StorefrontPayload = {
  tenant: {
    id: string;
    slug: string;
    name: string;
  };
  categories: Category[];
  products: Product[];
  settings: StorefrontSettings;
};

const STOREFRONT_CACHE_VERSION = "ver-0-205b";
const STOREFRONT_CACHE_MAX_AGE_MS = 1000 * 60 * 20;

function cacheKeyForTenant(tenantSlug: string) {
  return `orduva_storefront_payload_${STOREFRONT_CACHE_VERSION}_${tenantSlug}`;
}

function readCachedPayload(tenantSlug: string): StorefrontPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKeyForTenant(tenantSlug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt?: number; payload?: StorefrontPayload };
    if (!parsed?.payload || !parsed.savedAt) return null;
    if (Date.now() - parsed.savedAt > STOREFRONT_CACHE_MAX_AGE_MS) return null;
    if (!Array.isArray(parsed.payload.products) || !Array.isArray(parsed.payload.categories)) return null;
    return parsed.payload;
  } catch {
    return null;
  }
}

function writeCachedPayload(tenantSlug: string, payload: StorefrontPayload) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKeyForTenant(tenantSlug), JSON.stringify({ savedAt: Date.now(), payload }));
  } catch {
    // Storage can be unavailable in private mode. Storefront still works normally.
  }
}

function StorefrontPreparingShell({ backgroundColor }: { backgroundColor: string }) {
  return (
    <main
      aria-busy="true"
      className="mx-auto flex min-h-screen max-w-7xl items-center justify-center overflow-x-clip px-4 pb-10 pt-0 sm:px-5 lg:px-6"
      style={{ backgroundColor }}
    >
      <section className="flex max-w-[320px] flex-col items-center justify-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center" aria-hidden="true">
          <span className="absolute h-20 w-20 rounded-full border border-orange-200/70 bg-white/70 shadow-[0_18px_50px_rgba(15,23,42,0.10)]" />
          <span className="absolute h-14 w-14 animate-ping rounded-full bg-orange-400/20" />
          <span className="absolute h-12 w-12 rounded-full border-4 border-orange-100" />
          <span className="absolute h-12 w-12 animate-spin rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_0_8px_rgba(249,115,22,0.10)]" />
        </div>
        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-orange-700">Orduva</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">We&apos;re getting things ready.</h1>
        <div className="mt-4 flex items-center justify-center gap-1.5" aria-label="Loading">
          <span className="h-2 w-2 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.24s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-orange-500 [animation-delay:-0.12s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-orange-500" />
        </div>
      </section>
    </main>
  );
}

function ErrorStorefrontShell({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="mx-auto min-h-screen max-w-7xl overflow-x-clip bg-[#F8F4F0] px-4 pb-10 pt-4 sm:px-5 lg:px-6">
      <section className="rounded-[32px] border border-red-200 bg-white px-5 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-red-600">Store loading issue</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-[#2B2B2B]">The menu did not load.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{message}</p>
        <button type="button" onClick={onRetry} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#2B2B2B] px-5 py-3 text-sm font-black text-white shadow-sm">
          Try again
        </button>
      </section>
    </main>
  );
}

export default function StorefrontClientLoader({ tenantSlug, version, initialProductId }: { tenantSlug: string; version: string; initialProductId?: string | null }) {
  const [payload, setPayload] = useState<StorefrontPayload | null>(() => readCachedPayload(tenantSlug));
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!payload && !error) return;

    const hideEarlyPreloader = (window as Window & { __ORDUVA_HIDE_EARLY_PRELOADER__?: () => void }).__ORDUVA_HIDE_EARLY_PRELOADER__;
    if (typeof hideEarlyPreloader === "function") {
      hideEarlyPreloader();
      return;
    }

    document.documentElement.classList.add("orduva-early-preloader-done");
  }, [payload, error]);

  useEffect(() => {
    const cached = readCachedPayload(tenantSlug);
    if (cached) {
      setPayload(cached);
      setError(null);
    }
  }, [tenantSlug]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    async function loadStorefront() {
      setError(null);
      try {
        const res = await fetch(`/api/products?tenantSlug=${encodeURIComponent(tenantSlug)}`, {
          cache: "default",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          if (!payload) setError(String(data?.error || "The storefront data could not be loaded."));
          return;
        }
        const nextPayload = data as StorefrontPayload;
        setPayload(nextPayload);
        writeCachedPayload(tenantSlug, nextPayload);
      } catch (err) {
        if (cancelled) return;
        if (!payload) {
          setError(err instanceof DOMException && err.name === "AbortError" ? "The menu request took too long. Please check the connection and try again." : "The storefront data could not be loaded.");
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void loadStorefront();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [tenantSlug, retryKey]);

  const settings = payload?.settings;
  const pageBackground = useMemo(() => settings?.storefrontTheme?.globalPageBackground || settings?.backgroundTint || "#F8F4F0", [settings]);

  if (error) return <ErrorStorefrontShell message={error} onRetry={() => setRetryKey((key) => key + 1)} />;
  if (!payload || !settings) return <StorefrontPreparingShell backgroundColor={pageBackground} />;

  return (
    <main className="mx-auto min-h-screen max-w-7xl overflow-x-clip px-4 pb-10 pt-0 sm:px-5 lg:px-6" style={{ backgroundColor: pageBackground }}>
      <MenuBrowser
        tenantSlug={payload.tenant.slug || tenantSlug}
        tenantId={settings.tenantId || payload.tenant.id}
        tenantName={settings.displayName || payload.tenant.name}
        version={version}
        categories={payload.categories || []}
        products={payload.products || []}
        logoUrl={settings.logoUrl}
        headerLogoUrl={settings.logoUrl}
        welcomeHeading={settings.storefrontHeading}
        welcomeSubheading={settings.storefrontSubheading}
        primaryColor={settings.primaryColor}
        accentColor={settings.accentColor}
        backgroundTint={settings.backgroundTint}
        borderColor={settings.borderColor}
        textColor={settings.textColor}
        contactPhone={settings.contactPhone}
        contactEmail={settings.contactEmail}
        contactWhatsApp={settings.contactWhatsApp}
        contactAddress={settings.contactAddress}
        footerBlurb={settings.footerBlurb}
        footerNotice={settings.footerNotice}
        showOrduvaReferralAd={settings.showOrduvaReferralAd !== false}
        socialFacebookUrl={settings.socialFacebookUrl}
        socialInstagramUrl={settings.socialInstagramUrl}
        socialTikTokUrl={settings.socialTikTokUrl}
        socialXUrl={settings.socialXUrl}
        socialWebsiteUrl={settings.socialWebsiteUrl}
        currencyName={settings.currencyName}
        currencyCode={settings.currencyCode}
        currencySymbol={settings.currencySymbol}
        currencyDisplayMode={settings.currencyDisplayMode}
        currencySymbolPosition={settings.currencySymbolPosition}
        currencyDecimalPlaces={settings.currencyDecimalPlaces}
        currencyUseThousandsSeparator={settings.currencyUseThousandsSeparator}
        currencyDecimalSeparator={settings.currencyDecimalSeparator}
        currencyThousandsSeparator={settings.currencyThousandsSeparator}
        currencySuffix={settings.currencySuffix}
        storefrontTheme={settings.storefrontTheme}
        trialState={settings.trialState}
        initialProductId={initialProductId}
      />
    </main>
  );
}
