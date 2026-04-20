import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

export async function generateMetadata(): Promise<Metadata> {
  const routeKind = (await headers()).get("x-orduva-route-kind");

  if (routeKind === "admin") {
    return {
      title: "Orduva Admin",
      description: "Phone-first tenant admin for Orduva.",
      applicationName: "Orduva Admin",
      themeColor: "#000000",
      icons: {
        icon: [
          { url: "/orduva-admin-icon-192.png", sizes: "192x192", type: "image/png" },
          { url: "/orduva-admin-icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        shortcut: "/orduva-admin-icon-192.png",
        apple: "/orduva-admin-icon-192.png",
      },
    };
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
