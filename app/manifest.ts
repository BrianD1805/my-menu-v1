import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getTenantBySlug, isRootPlatformRequest, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { isSharedAdminHost, normalizeHostname } from "@/lib/admin-host";

function buildStorefrontIcons(icon: string): MetadataRoute.Manifest["icons"] {
  const fallback192 = "/orduva-storefront-icon-192.png";
  const fallback512 = "/orduva-storefront-icon-512.png";

  if (icon.endsWith(".png")) {
    return [
      { src: icon, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icon, sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: icon, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: icon, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ];
  }

  return [
    { src: fallback192, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: fallback192, sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: fallback512, sizes: "512x512", type: "image/png", purpose: "any" },
    { src: fallback512, sizes: "512x512", type: "image/png", purpose: "maskable" },
  ];
}

function buildRootPlatformManifest(): MetadataRoute.Manifest {
  return {
    id: "/?app=orduva-platform",
    name: "Orduva",
    short_name: "Orduva",
    description: "Modern online ordering for restaurants, cafés, takeaways, and local businesses.",
    start_url: "/?source=pwa&app=orduva-platform",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait",
    background_color: "#FFF7F0",
    theme_color: "#0E0E10",
    categories: ["business", "food", "productivity"],
    icons: [
      { src: "/orduva-notification-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/orduva-platform-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/orduva-platform-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/orduva-platform-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/orduva-platform-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

function buildAdminManifest(): MetadataRoute.Manifest {
  return {
    id: "/admin/app/orduva-admin",
    name: "Orduva Admin",
    short_name: "Orduva Admin",
    description: "Phone-first tenant admin for Orduva sellers.",
    start_url: "/admin/login?source=pwa&app=orduva-admin",
    scope: "/admin",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait",
    background_color: "#FFF7F0",
    theme_color: "#0E0E10",
    categories: ["business", "productivity"],
    icons: [
      { src: "/orduva-notification-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/orduva-platform-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/orduva-platform-icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/orduva-platform-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/orduva-platform-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const h = await headers();
  const host = normalizeHostname(h.get("x-forwarded-host") || h.get("host") || "");

  if (isSharedAdminHost(host)) {
    return buildAdminManifest();
  }

  if (await isRootPlatformRequest()) {
    return buildRootPlatformManifest();
  }

  try {
    const slug = await resolveTenantSlug();
    const tenant = await getTenantBySlug(slug);
    const settings = await getTenantSettings(tenant.id);
    const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
    const icon = branding.faviconUrl || "/orduva-storefront-icon-512.png";

    return {
      id: "/?app=storefront",
      name: `${branding.displayName} | Orduva Online`,
      short_name: branding.displayName,
      description: branding.storefrontSubheading || "Online ordering",
      start_url: "/?source=pwa&app=storefront",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: branding.primaryColor || "#0f172a",
      icons: buildStorefrontIcons(icon),
    };
  } catch {
    return {
      id: "/?app=storefront",
      name: "Orduva Online",
      short_name: "Orduva",
      description: "Online ordering",
      start_url: "/?source=pwa&app=storefront",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0f172a",
      icons: buildStorefrontIcons("/orduva-storefront-icon-512.png"),
    };
  }
}
