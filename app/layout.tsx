import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import OrduvaAnalyticsTracker from "@/components/analytics/OrduvaAnalyticsTracker";
import { headers } from "next/headers";
import { isRootPlatformHost } from "@/lib/tenant";
import { isSharedAdminHost, normalizeHostname } from "@/lib/admin-host";

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

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const routeKind = h.get("x-orduva-route-kind");
  const host = normalizeHostname(h.get("x-forwarded-host") || h.get("host") || "");

  if (routeKind === "admin" || isSharedAdminHost(host)) {
    return buildAdminMetadata();
  }

  if (isRootPlatformHost(host)) {
    return buildRootPlatformMetadata();
  }

  // Ver-0.174: keep storefront metadata deliberately lightweight.
  // The previous version resolved the tenant and settings from Supabase here,
  // which delayed the first HTML response and kept the native mobile PWA splash
  // on screen before our own Orduva preloader could paint. Tenant-specific
  // branding still loads inside the storefront payload.
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><OrduvaAnalyticsTracker />{children}</body>
    </html>
  );
}
