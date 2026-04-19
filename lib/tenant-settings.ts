import { db } from "@/lib/db";
import {
  buildMoneySettings,
  DEFAULT_CURRENCY_CODE,
  DEFAULT_CURRENCY_DECIMAL_PLACES,
  DEFAULT_CURRENCY_DECIMAL_SEPARATOR,
  DEFAULT_CURRENCY_DISPLAY_MODE,
  DEFAULT_CURRENCY_NAME,
  DEFAULT_CURRENCY_SUFFIX,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_CURRENCY_SYMBOL_POSITION,
  DEFAULT_CURRENCY_THOUSANDS_SEPARATOR,
  DEFAULT_CURRENCY_USE_THOUSANDS_SEPARATOR,
  type CurrencyDisplayMode,
  type CurrencySymbolPosition,
} from "@/lib/money";

export type TenantSettings = {
  tenant_id: string;
  business_display_name: string | null;
  storefront_heading: string | null;
  storefront_subheading: string | null;
  admin_heading_label: string | null;
  logo_url: string | null;
  favicon_url: string | null;
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
  currency_display_mode: CurrencyDisplayMode | null;
  currency_symbol_position: CurrencySymbolPosition | null;
  currency_decimal_places: number | null;
  currency_use_thousands_separator: boolean | null;
  currency_decimal_separator: string | null;
  currency_thousands_separator: string | null;
  currency_suffix: string | null;
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

function asStringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function asBooleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function asCurrencyDisplayModeOrNull(value: unknown): CurrencyDisplayMode | null {
  return value === "symbol" || value === "code" || value === "code_symbol" || value === "symbol_code" || value === "none"
    ? value
    : null;
}

function asCurrencySymbolPositionOrNull(value: unknown): CurrencySymbolPosition | null {
  return value === "before" || value === "after" ? value : null;
}


export function normalizeCurrencyCode(value: unknown) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

export function normalizeCurrencyDisplayMode(value: unknown): CurrencyDisplayMode | null {
  const mode = String(value || "").trim().toLowerCase();
  return ["symbol", "code", "code_symbol", "symbol_code", "none"].includes(mode)
    ? (mode as CurrencyDisplayMode)
    : null;
}

export function normalizeCurrencySymbolPosition(value: unknown): CurrencySymbolPosition | null {
  const position = String(value || "").trim().toLowerCase();
  return position === "before" || position === "after" ? (position as CurrencySymbolPosition) : null;
}

export function normalizeCurrencyDecimalPlaces(value: unknown) {
  const raw = Number(value);
  if (!Number.isInteger(raw)) return null;
  return Math.min(4, Math.max(0, raw));
}

export function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function normalizeSeparator(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  return text.slice(0, 1);
}

const SETTINGS_SELECT = "tenant_id, business_display_name, storefront_heading, storefront_subheading, admin_heading_label, logo_url, primary_color, accent_color, contact_phone, contact_email, contact_whatsapp, contact_address, footer_blurb, footer_notice, currency_name, currency_code, currency_symbol, currency_display_mode, currency_symbol_position, currency_decimal_places, currency_use_thousands_separator, currency_decimal_separator, currency_thousands_separator, currency_suffix";

export async function getTenantSettings(tenantId: string): Promise<TenantSettings | null> {
  const { data, error } = await db
    .from("tenant_settings")
    .select(SETTINGS_SELECT)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load tenant settings", error);
    return null;
  }

  if (!data) return null;

  return {
    tenant_id: String(data.tenant_id),
    business_display_name: asStringOrNull(data.business_display_name),
    storefront_heading: asStringOrNull(data.storefront_heading),
    storefront_subheading: asStringOrNull(data.storefront_subheading),
    admin_heading_label: asStringOrNull(data.admin_heading_label),
    logo_url: asStringOrNull(data.logo_url),
    favicon_url: asStringOrNull((data as Record<string, unknown>).favicon_url),
    primary_color: asStringOrNull(data.primary_color),
    accent_color: asStringOrNull(data.accent_color),
    contact_phone: asStringOrNull((data as Record<string, unknown>).contact_phone),
    contact_email: asStringOrNull((data as Record<string, unknown>).contact_email),
    contact_whatsapp: asStringOrNull((data as Record<string, unknown>).contact_whatsapp),
    contact_address: asStringOrNull((data as Record<string, unknown>).contact_address),
    footer_blurb: asStringOrNull((data as Record<string, unknown>).footer_blurb),
    footer_notice: asStringOrNull((data as Record<string, unknown>).footer_notice),
    currency_name: asStringOrNull((data as Record<string, unknown>).currency_name),
    currency_code: asStringOrNull((data as Record<string, unknown>).currency_code),
    currency_symbol: asStringOrNull((data as Record<string, unknown>).currency_symbol),
    currency_display_mode: asCurrencyDisplayModeOrNull((data as Record<string, unknown>).currency_display_mode),
    currency_symbol_position: asCurrencySymbolPositionOrNull((data as Record<string, unknown>).currency_symbol_position),
    currency_decimal_places: asNumberOrNull((data as Record<string, unknown>).currency_decimal_places),
    currency_use_thousands_separator: asBooleanOrNull((data as Record<string, unknown>).currency_use_thousands_separator),
    currency_decimal_separator: asStringOrNull((data as Record<string, unknown>).currency_decimal_separator),
    currency_thousands_separator: asStringOrNull((data as Record<string, unknown>).currency_thousands_separator),
    currency_suffix: asStringOrNull((data as Record<string, unknown>).currency_suffix),
  };
}

export function buildTenantBranding(tenantName: string, settings: TenantSettings | null) {
  const displayName = settings?.business_display_name || tenantName;
  const money = buildMoneySettings({
    currencyName: settings?.currency_name || DEFAULT_CURRENCY_NAME,
    currencyCode: settings?.currency_code || DEFAULT_CURRENCY_CODE,
    currencySymbol: settings?.currency_symbol || DEFAULT_CURRENCY_SYMBOL,
    currencyDisplayMode: settings?.currency_display_mode || DEFAULT_CURRENCY_DISPLAY_MODE,
    currencySymbolPosition: settings?.currency_symbol_position || DEFAULT_CURRENCY_SYMBOL_POSITION,
    currencyDecimalPlaces: settings?.currency_decimal_places ?? DEFAULT_CURRENCY_DECIMAL_PLACES,
    currencyUseThousandsSeparator: settings?.currency_use_thousands_separator ?? DEFAULT_CURRENCY_USE_THOUSANDS_SEPARATOR,
    currencyDecimalSeparator: settings?.currency_decimal_separator || DEFAULT_CURRENCY_DECIMAL_SEPARATOR,
    currencyThousandsSeparator: settings?.currency_thousands_separator || DEFAULT_CURRENCY_THOUSANDS_SEPARATOR,
    currencySuffix: settings?.currency_suffix || DEFAULT_CURRENCY_SUFFIX,
  });

  return {
    displayName,
    storefrontHeading: settings?.storefront_heading || "Browse the menu",
    storefrontSubheading:
      settings?.storefront_subheading || "Tap into the details for more information, or add favourites straight to your order.",
    adminHeadingLabel: settings?.admin_heading_label || displayName,
    logoUrl: settings?.logo_url || null,
    faviconUrl: settings?.favicon_url || null,
    primaryColor: settings?.primary_color || DEFAULT_PRIMARY_COLOR,
    accentColor: settings?.accent_color || DEFAULT_ACCENT_COLOR,
    contactPhone: settings?.contact_phone || null,
    contactEmail: settings?.contact_email || null,
    contactWhatsApp: settings?.contact_whatsapp || null,
    contactAddress: settings?.contact_address || null,
    footerBlurb: settings?.footer_blurb || "Thank you for ordering with us.",
    footerNotice: settings?.footer_notice || "Prices and availability may change without notice.",
    ...money,
  };
}
