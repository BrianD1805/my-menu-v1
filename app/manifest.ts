import type { MetadataRoute } from "next";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  try {
    const slug = await resolveTenantSlug();
    const tenant = await getTenantBySlug(slug);
    const settings = await getTenantSettings(tenant.id);
    const branding = buildTenantBranding(slug, tenant.name, settings);
    const icon = branding.faviconUrl || "/favicon.ico";

    return {
      name: `${branding.displayName} | Orduva Online`,
      short_name: branding.displayName,
      description: branding.storefrontSubheading || "Online ordering",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: branding.primaryColor || "#0f172a",
      icons: [
        {
          src: icon,
          type: "image/png",
        },
        {
          src: icon,
          type: "image/png",
          purpose: "maskable",
        },
      ],
    };
  } catch {
    return {
      name: "Orduva Online",
      short_name: "Orduva",
      description: "Online ordering",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0f172a",
      icons: [
        {
          src: "/favicon.ico",
          type: "image/x-icon",
        },
      ],
    };
  }
}
