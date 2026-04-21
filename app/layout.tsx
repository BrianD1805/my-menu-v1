import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { isSharedAdminHost, normalizeHostname } from "@/lib/admin-host";

function buildAdminMetadata(): Metadata {
  return {
    title: "Orduva Admin",
    description: "Phone-first tenant admin for Orduva.",
    applicationName: "Orduva Admin",
    manifest: "/admin/manifest.webmanifest",
    themeColor: "#000000",
    icons: {
      icon: [
        { url: "/orduva-admin-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/orduva-admin-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/orduva-admin-icon-192.png",
      apple: "/orduva-admin-icon-192.png",
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

  try {
    const slug = await resolveTenantSlug();
    const tenant = await getTenantBySlug(slug);
    const settings = await getTenantSettings(tenant.id);
    const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
    const faviconUrl = branding.faviconUrl || "/favicon.ico";
    const title = `${branding.displayName} | Orduva Online`;

    return {
      title,
      description: branding.storefrontSubheading || "Online ordering",
      icons: {
        icon: faviconUrl,
        shortcut: faviconUrl,
        apple: faviconUrl,
      },
      manifest: "/manifest.webmanifest",
      themeColor: branding.primaryColor || "#0f172a",
      applicationName: branding.displayName,
    };
  } catch {
    return {
      title: "Orduva Online",
      description: "Online ordering",
      manifest: "/manifest.webmanifest",
    };
  }
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
