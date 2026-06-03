import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import OrduvaAnalyticsTracker from "@/components/analytics/OrduvaAnalyticsTracker";
import { headers } from "next/headers";
import { isRootPlatformHost } from "@/lib/tenant";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";
import { isSharedAdminHost, normalizeHostname } from "@/lib/admin-host";
import { buildTenantBranding, getTenantSettings, type TenantSettings } from "@/lib/tenant-settings";

function buildRootPlatformMetadata(): Metadata {
  return {
    title: "Orduva | Online Ordering Platform",
    description: "Orduva is a modern online ordering platform for restaurants, cafés, takeaways, and local businesses.",
    applicationName: "Orduva",
    manifest: "/manifest.webmanifest",
    themeColor: "#0E0E10",
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/orduva-platform-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/orduva-platform-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: "/orduva-apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Orduva",
    },
    openGraph: {
      title: "Orduva | Online Ordering Platform",
      description: "Beautiful tenant storefronts, shared admin, customer accounts, and order notifications for food businesses.",
      siteName: "Orduva",
      type: "website",
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-title": "Orduva",
    },
  };
}

function buildAdminMetadata(): Metadata {
  return {
    title: "Orduva Admin",
    description: "Phone-first tenant admin for Orduva.",
    applicationName: "Orduva Admin",
    manifest: "/admin/manifest.webmanifest",
    themeColor: "#0E0E10",
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/orduva-platform-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/orduva-platform-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: "/orduva-apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Orduva Admin",
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-title": "Orduva Admin",
    },
  };
}


function buildOwnerPlatformMetadata(): Metadata {
  return {
    title: "Orduva Owner Platform",
    description: "Owner dashboard for urgent Orduva platform checks, billing and tenant support.",
    applicationName: "Orduva Owner Platform",
    manifest: "/orduva-owner-platform.webmanifest?v=0.229i",
    themeColor: "#336699",
    icons: {
      icon: [
        { url: "/orduva-owner-platform-favicon.ico?v=0.229i" },
        { url: "/orduva-owner-platform-icon-32.png?v=0.229i", sizes: "32x32", type: "image/png" },
        { url: "/orduva-owner-platform-icon-48.png?v=0.229i", sizes: "48x48", type: "image/png" },
        { url: "/orduva-owner-platform-icon-192.png?v=0.229i", sizes: "192x192", type: "image/png" },
        { url: "/orduva-owner-platform-icon-512.png?v=0.229i", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/orduva-owner-platform-favicon.ico?v=0.229i",
      apple: "/orduva-owner-platform-icon-192.png?v=0.229i",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Orduva Owner",
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-title": "Orduva Owner",
    },
  };
}

type StorefrontSeoContext = {
  tenant: any;
  settings: TenantSettings | null;
  branding: ReturnType<typeof buildTenantBranding>;
  url: string;
};

function trimTo(value: string | null | undefined, max: number) {
  return String(value || "").trim().slice(0, max);
}

function splitKeywords(value: string | null | undefined) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 16);
}

function normalizeTrackingId(value: string | null | undefined) {
  const text = String(value || "").trim().toUpperCase();
  return /^(G|UA|AW)-[A-Z0-9-]{4,40}$/.test(text) ? text : "";
}

function normalizeGtmId(value: string | null | undefined) {
  const text = String(value || "").trim().toUpperCase();
  return /^GTM-[A-Z0-9]{4,20}$/.test(text) ? text : "";
}

async function loadStorefrontSeoContext(): Promise<StorefrontSeoContext | null> {
  try {
    const h = await headers();
    const host = normalizeHostname(h.get("x-forwarded-host") || h.get("host") || "");
    const proto = h.get("x-forwarded-proto") || "https";
    const slug = await resolveTenantSlug();
    const tenant = await getTenantBySlug(slug);
    const settings = await getTenantSettings(tenant.id);
    const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
    return { tenant, settings, branding, url: `${proto}://${host || "www.orduva.com"}/` };
  } catch {
    return null;
  }
}

function buildStorefrontMetadata(context: StorefrontSeoContext): Metadata {
  const { tenant, settings, branding, url } = context;
  const title = trimTo(settings?.seo_page_name, 55) || trimTo(`${branding.displayName} | Online Ordering`, 55);
  const description = trimTo(settings?.seo_meta_description, 160) || trimTo(branding.storefrontSubheading || "Online ordering", 160);
  const canonical = trimTo(settings?.seo_canonical_url, 500) || url;
  const favicon = branding.faviconUrl || "/orduva-storefront-icon-192.png";
  const logo = branding.logoUrl || favicon;

  return {
    title,
    description,
    keywords: splitKeywords(settings?.seo_keywords),
    manifest: "/manifest.webmanifest",
    themeColor: branding.primaryColor || "#0E0E10",
    applicationName: branding.displayName,
    alternates: { canonical },
    icons: {
      icon: [
        { url: favicon },
        { url: favicon, sizes: "32x32" },
        { url: favicon, sizes: "192x192" },
      ],
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: branding.displayName,
      type: "website",
      images: logo ? [{ url: logo, alt: branding.displayName }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: logo ? [logo] : undefined,
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-title": branding.displayName,
      "orduva-tenant-slug": String(tenant.slug || ""),
    },
  };
}

function buildStorefrontJsonLd(context: StorefrontSeoContext) {
  const { branding, settings, url } = context;
  const sameAs = [
    branding.socialWebsiteUrl,
    branding.socialFacebookUrl,
    branding.socialInstagramUrl,
    branding.socialTikTokUrl,
    branding.socialXUrl,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: branding.displayName,
    url: trimTo(settings?.seo_canonical_url, 500) || url,
    description: trimTo(settings?.seo_meta_description, 160) || branding.storefrontSubheading,
    logo: branding.logoUrl || undefined,
    image: branding.logoUrl || undefined,
    email: branding.contactEmail || undefined,
    telephone: branding.contactPhone || branding.contactWhatsApp || undefined,
    address: branding.contactAddress ? { "@type": "PostalAddress", streetAddress: branding.contactAddress } : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    potentialAction: {
      "@type": "OrderAction",
      target: trimTo(settings?.seo_canonical_url, 500) || url,
      name: "Place an online order",
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const routeKind = h.get("x-orduva-route-kind");
  const host = normalizeHostname(h.get("x-forwarded-host") || h.get("host") || "");

  if (routeKind === "platform") {
    return buildOwnerPlatformMetadata();
  }

  if (routeKind === "admin" || isSharedAdminHost(host)) {
    return buildAdminMetadata();
  }

  if (isRootPlatformHost(host)) {
    return buildRootPlatformMetadata();
  }

  const context = await loadStorefrontSeoContext();
  if (context) return buildStorefrontMetadata(context);

  return {
    title: "Orduva Online",
    description: "Online ordering",
    manifest: "/manifest.webmanifest",
    themeColor: "#0E0E10",
    applicationName: "Orduva",
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/orduva-storefront-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/orduva-storefront-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.ico",
      apple: "/orduva-apple-touch-icon.png",
    },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const routeKind = h.get("x-orduva-route-kind");
  const host = normalizeHostname(h.get("x-forwarded-host") || h.get("host") || "");
  const isTenantStorefront = routeKind !== "admin" && routeKind !== "platform" && !isSharedAdminHost(host) && !isRootPlatformHost(host);
  const context = isTenantStorefront ? await loadStorefrontSeoContext() : null;
  const settings = context?.settings || null;
  const trackingId = normalizeTrackingId(settings?.google_tracking_id);
  const gtmId = normalizeGtmId(settings?.google_tag_manager_id);
  const showJsonLd = context && settings?.seo_structured_data_enabled !== false;

  return (
    <html lang="en">
      <body>
        {gtmId ? (
          <noscript>
            <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
          </noscript>
        ) : null}
        {gtmId ? <Script id="orduva-google-tag-manager" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}</Script> : null}
        {trackingId ? <Script src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`} strategy="afterInteractive" /> : null}
        {trackingId ? <Script id="orduva-google-analytics" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${trackingId}');`}</Script> : null}
        {context && showJsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStorefrontJsonLd(context)) }} /> : null}
        <OrduvaAnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
