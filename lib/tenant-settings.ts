import { db } from "@/lib/db";

export type TenantSettings = {
  tenant_id: string;
  business_display_name: string | null;
  storefront_heading: string | null;
  storefront_subheading: string | null;
  admin_heading_label: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
};

export const DEFAULT_PRIMARY_COLOR = "#0f172a";
export const DEFAULT_ACCENT_COLOR = "#10b981";

export function normalizeColor(value: unknown) {
  const color = String(value || "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : null;
}

export function normalizeOptionalText(value: unknown, maxLength: number) {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings | null> {
  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, business_display_name, storefront_heading, storefront_subheading, admin_heading_label, logo_url, primary_color, accent_color")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load tenant settings", error);
    return null;
  }

  return data || null;
}

export function buildTenantBranding(tenantName: string, settings: TenantSettings | null) {
  const displayName = settings?.business_display_name || tenantName;
  return {
    displayName,
    storefrontHeading: settings?.storefront_heading || "Browse the menu",
    storefrontSubheading:
      settings?.storefront_subheading || "Tap into the details for more information, or add favourites straight to your order.",
    adminHeadingLabel: settings?.admin_heading_label || displayName,
    logoUrl: settings?.logo_url || null,
    primaryColor: settings?.primary_color || DEFAULT_PRIMARY_COLOR,
    accentColor: settings?.accent_color || DEFAULT_ACCENT_COLOR,
  };
}
