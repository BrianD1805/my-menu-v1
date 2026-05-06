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

function QuietStorefrontLoadingShell({ backgroundColor }: { backgroundColor: string }) {
  // Ver-0.170: keep first-load client fetching invisible.
  // The phone/PWA splash should clear quickly without replacing it with a large
  // in-page loading card.
  return <main aria-busy="true" className="mx-auto min-h-screen max-w-7xl overflow-x-clip px-4 pb-10 pt-0 sm:px-5 lg:px-6" style={{ backgroundColor }} />;
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

export default function StorefrontClientLoader({ tenantSlug, version }: { tenantSlug: string; version: string }) {
  const [payload, setPayload] = useState<StorefrontPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    async function loadStorefront() {
      setError(null);
      try {
        const res = await fetch(`/api/products?tenantSlug=${encodeURIComponent(tenantSlug)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setPayload(null);
          setError(String(data?.error || "The storefront data could not be loaded."));
          return;
        }
        setPayload(data as StorefrontPayload);
      } catch (err) {
        if (cancelled) return;
        setPayload(null);
        setError(err instanceof DOMException && err.name === "AbortError" ? "The menu request took too long. Please check the connection and try again." : "The storefront data could not be loaded.");
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
  if (!payload || !settings) return <QuietStorefrontLoadingShell backgroundColor={pageBackground} />;

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
      />
    </main>
  );
}
