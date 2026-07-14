import { NextResponse, type NextRequest } from "next/server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { getTenantBySlug, resolveTenantSlugFromRequestAsync } from "@/lib/tenant-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ManifestIcon = {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
};

function isUsableIconUrl(value: string | null | undefined) {
  const url = String(value || "").trim();
  if (!url) return false;
  return /\.(png|jpg|jpeg|webp|svg)(?:[?#].*)?$/i.test(url) || url.startsWith("https://");
}

function iconTypeFor(src: string) {
  if (/\.svg(?:[?#].*)?$/i.test(src)) return "image/svg+xml";
  if (/\.webp(?:[?#].*)?$/i.test(src)) return "image/webp";
  if (/\.jpe?g(?:[?#].*)?$/i.test(src)) return "image/jpeg";
  return "image/png";
}

function buildStorefrontIcons(icon: string | null | undefined): ManifestIcon[] {
  const fallback192 = "/orduva-storefront-icon-192.png";
  const fallback512 = "/orduva-storefront-icon-512.png";
  const icons: ManifestIcon[] = [];
  const src = String(icon || "").trim();

  if (isUsableIconUrl(src)) {
    const type = iconTypeFor(src);
    icons.push(
      { src, sizes: "192x192", type, purpose: "any" },
      { src, sizes: "192x192", type, purpose: "maskable" },
    );
  }

  // Always include known same-origin 192/512 icons so Chrome sees a fully
  // installable manifest even when a store favicon is small, remote, or cached.
  icons.push(
    { src: fallback192, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: fallback192, sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: fallback512, sizes: "512x512", type: "image/png", purpose: "any" },
    { src: fallback512, sizes: "512x512", type: "image/png", purpose: "maskable" },
  );

  return icons;
}

function manifestResponse(body: Record<string, unknown>) {
  return new NextResponse(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const tenantSlug = await resolveTenantSlugFromRequestAsync(req);
    const tenant = await getTenantBySlug(tenantSlug);
    const settings = await getTenantSettings(tenant.id);
    const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
    const displayName = branding.displayName || tenant.name || "Orduva Store";
    const description = branding.storefrontSubheading || "Online ordering";
    const icon = branding.faviconUrl || branding.logoUrl || "/orduva-storefront-icon-512.png";

    return manifestResponse({
      id: `/?app=storefront&tenant=${encodeURIComponent(String(tenant.slug || tenant.id))}`,
      name: `${displayName} | Orduva Online`,
      short_name: String(displayName).slice(0, 30),
      description,
      start_url: "/?source=pwa&app=storefront",
      scope: "/",
      display: "standalone",
      display_override: ["standalone", "minimal-ui", "browser"],
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: branding.primaryColor || "#0f172a",
      categories: ["food", "shopping", "business"],
      icons: buildStorefrontIcons(icon),
      shortcuts: [
        {
          name: "Open menu",
          short_name: "Menu",
          url: "/?source=pwa-shortcut",
          icons: buildStorefrontIcons(icon).slice(0, 2),
        },
      ],
    });
  } catch {
    return manifestResponse({
      id: "/?app=storefront",
      name: "Orduva Online",
      short_name: "Orduva",
      description: "Online ordering",
      start_url: "/?source=pwa&app=storefront",
      scope: "/",
      display: "standalone",
      display_override: ["standalone", "minimal-ui", "browser"],
      orientation: "portrait",
      background_color: "#ffffff",
      theme_color: "#0f172a",
      categories: ["food", "shopping", "business"],
      icons: buildStorefrontIcons("/orduva-storefront-icon-512.png"),
    });
  }
}
