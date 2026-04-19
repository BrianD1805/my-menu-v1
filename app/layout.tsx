import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const slug = await resolveTenantSlug();
    const tenant = await getTenantBySlug(slug);
    const settings = await getTenantSettings(tenant.id);
    const branding = buildTenantBranding(slug, tenant.name, settings);
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
