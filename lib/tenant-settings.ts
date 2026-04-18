import { db } from "@/lib/db";
import { DEFAULT_CURRENCY_CODE, DEFAULT_CURRENCY_NAME, DEFAULT_CURRENCY_SYMBOL, formatMoney } from "@/lib/money";

export type TenantSettings = {
  tenant_id: string;
  business_display_name: string | null;
  storefront_heading: string | null;
  storefront_subheading: string | null;
  admin_heading_label: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  contact_address: string | null;
  footer_blurb: string | null;
  footer_notice: string | null;
  currency_name: string | null;
  currency_code: string | null;
  currency_symbol: string | null;
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

export function normalizeCurrencyCode(value: unknown) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

export async function getTenantSettings(tenantId: string): Promise<TenantSettings | null> {
  const { data, error } = await db
    .from("tenant_settings")
    .select("tenant_id, business_display_name, storefront_heading, storefront_subheading, admin_heading_label, logo_url, primary_color, accent_color, contact_phone, contact_email, contact_whatsapp, contact_address, footer_blurb, footer_notice, currency_name, currency_code, currency_symbol")
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
    contactPhone: settings?.contact_phone || null,
    contactEmail: settings?.contact_email || null,
    contactWhatsApp: settings?.contact_whatsapp || null,
    contactAddress: settings?.contact_address || null,
    footerBlurb: settings?.footer_blurb || "Thank you for ordering with us.",
    footerNotice: settings?.footer_notice || "Prices and availability may change without notice.",
    currencyName: settings?.currency_name || DEFAULT_CURRENCY_NAME,
    currencyCode: settings?.currency_code || DEFAULT_CURRENCY_CODE,
    currencySymbol: settings?.currency_symbol || DEFAULT_CURRENCY_SYMBOL,
  };
}

