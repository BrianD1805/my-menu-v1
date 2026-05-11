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
import { getTenantBrandDefaults } from "@/lib/tenant-assets";
import { normalizeStorefrontTheme, type StorefrontTheme } from "@/lib/storefront-theme";

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
  background_tint: string | null;
  border_color: string | null;
  text_color: string | null;
  storefront_theme_json: StorefrontTheme | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  contact_address: string | null;
  footer_blurb: string | null;
  footer_notice: string | null;
  show_orduva_referral_ad: boolean | null;
  social_facebook_url: string | null;
  social_instagram_url: string | null;
  social_tiktok_url: string | null;
  social_x_url: string | null;
  social_website_url: string | null;
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
  enable_cash_on_collection: boolean | null;
  enable_cash_on_delivery: boolean | null;
  enable_stripe_customer_payments: boolean | null;
  stripe_connection_status: string | null;
  stripe_customer_payment_mode: string | null;
  stripe_customer_publishable_key: string | null;
  stripe_customer_account_label: string | null;
  stripe_customer_test_mode: boolean | null;
  stripe_customer_setup_notes: string | null;
  stripe_customer_secret_key_set?: boolean | null;
  stripe_customer_secret_key_hint?: string | null;
  stripe_customer_webhook_secret_set?: boolean | null;
  stripe_customer_webhook_secret_hint?: string | null;
  stripe_customer_payments_live?: boolean | null;
  enable_yoco_customer_payments: boolean | null;
  yoco_connection_status: string | null;
  enable_mpesa_customer_payments: boolean | null;
  mpesa_connection_status: string | null;
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

const SETTINGS_SELECT = "tenant_id, business_display_name, storefront_heading, storefront_subheading, admin_heading_label, logo_url, favicon_url, primary_color, accent_color, background_tint, border_color, text_color, storefront_theme_json, contact_phone, contact_email, contact_whatsapp, contact_address, footer_blurb, footer_notice, show_orduva_referral_ad, social_facebook_url, social_instagram_url, social_tiktok_url, social_x_url, social_website_url, currency_name, currency_code, currency_symbol, currency_display_mode, currency_symbol_position, currency_decimal_places, currency_use_thousands_separator, currency_decimal_separator, currency_thousands_separator, currency_suffix, enable_cash_on_collection, enable_cash_on_delivery, enable_stripe_customer_payments, stripe_connection_status, stripe_customer_payment_mode, stripe_customer_publishable_key, stripe_customer_account_label, stripe_customer_test_mode, stripe_customer_setup_notes, stripe_customer_payments_live, enable_yoco_customer_payments, yoco_connection_status, enable_mpesa_customer_payments, mpesa_connection_status";

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
    background_tint: asStringOrNull((data as Record<string, unknown>).background_tint),
    border_color: asStringOrNull((data as Record<string, unknown>).border_color),
    text_color: asStringOrNull((data as Record<string, unknown>).text_color),
    storefront_theme_json: normalizeStorefrontTheme((data as Record<string, unknown>).storefront_theme_json),
    contact_phone: asStringOrNull((data as Record<string, unknown>).contact_phone),
    contact_email: asStringOrNull((data as Record<string, unknown>).contact_email),
    contact_whatsapp: asStringOrNull((data as Record<string, unknown>).contact_whatsapp),
    contact_address: asStringOrNull((data as Record<string, unknown>).contact_address),
    footer_blurb: asStringOrNull((data as Record<string, unknown>).footer_blurb),
    footer_notice: asStringOrNull((data as Record<string, unknown>).footer_notice),
    show_orduva_referral_ad: asBooleanOrNull((data as Record<string, unknown>).show_orduva_referral_ad),
    social_facebook_url: asStringOrNull((data as Record<string, unknown>).social_facebook_url),
    social_instagram_url: asStringOrNull((data as Record<string, unknown>).social_instagram_url),
    social_tiktok_url: asStringOrNull((data as Record<string, unknown>).social_tiktok_url),
    social_x_url: asStringOrNull((data as Record<string, unknown>).social_x_url),
    social_website_url: asStringOrNull((data as Record<string, unknown>).social_website_url),
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
    enable_cash_on_collection: asBooleanOrNull((data as Record<string, unknown>).enable_cash_on_collection),
    enable_cash_on_delivery: asBooleanOrNull((data as Record<string, unknown>).enable_cash_on_delivery),
    enable_stripe_customer_payments: asBooleanOrNull((data as Record<string, unknown>).enable_stripe_customer_payments),
    stripe_connection_status: asStringOrNull((data as Record<string, unknown>).stripe_connection_status),
    stripe_customer_payment_mode: asStringOrNull((data as Record<string, unknown>).stripe_customer_payment_mode),
    stripe_customer_publishable_key: asStringOrNull((data as Record<string, unknown>).stripe_customer_publishable_key),
    stripe_customer_account_label: asStringOrNull((data as Record<string, unknown>).stripe_customer_account_label),
    stripe_customer_test_mode: asBooleanOrNull((data as Record<string, unknown>).stripe_customer_test_mode),
    stripe_customer_setup_notes: asStringOrNull((data as Record<string, unknown>).stripe_customer_setup_notes),
    stripe_customer_payments_live: asBooleanOrNull((data as Record<string, unknown>).stripe_customer_payments_live),
    enable_yoco_customer_payments: asBooleanOrNull((data as Record<string, unknown>).enable_yoco_customer_payments),
    yoco_connection_status: asStringOrNull((data as Record<string, unknown>).yoco_connection_status),
    enable_mpesa_customer_payments: asBooleanOrNull((data as Record<string, unknown>).enable_mpesa_customer_payments),
    mpesa_connection_status: asStringOrNull((data as Record<string, unknown>).mpesa_connection_status),
  };
}

export function buildTenantBranding(slug: string, tenantName: string, settings: TenantSettings | null): ReturnType<typeof _buildTenantBranding>;
export function buildTenantBranding(tenantName: string, settings: TenantSettings | null): ReturnType<typeof _buildTenantBranding>;
export function buildTenantBranding(arg1: string, arg2: string | TenantSettings | null, arg3?: TenantSettings | null) {
  if (typeof arg2 === "string") {
    return _buildTenantBranding(arg1, arg2, arg3 ?? null);
  }
  return _buildTenantBranding("", arg1, arg2 ?? null);
}

function _buildTenantBranding(slug: string, tenantName: string, settings: TenantSettings | null) {
  const defaults = getTenantBrandDefaults(slug);
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
    logoUrl: settings?.logo_url || defaults.starterLogoUrl,
    faviconUrl: settings?.favicon_url || defaults.starterFaviconUrl,
    primaryColor: settings?.primary_color || defaults.primaryColor || DEFAULT_PRIMARY_COLOR,
    accentColor: settings?.accent_color || defaults.accentColor || DEFAULT_ACCENT_COLOR,
    backgroundTint: settings?.background_tint || '#F8F4F0',
    borderColor: settings?.border_color || '#D9C7A3',
    textColor: settings?.text_color || '#2B2B2B',
    storefrontTheme: settings?.storefront_theme_json || null,
    contactPhone: settings?.contact_phone || null,
    contactEmail: settings?.contact_email || null,
    contactWhatsApp: settings?.contact_whatsapp || null,
    contactAddress: settings?.contact_address || null,
    footerBlurb: settings?.footer_blurb || "Thank you for ordering with us.",
    footerNotice: settings?.footer_notice || "Prices and availability may change without notice.",
    showOrduvaReferralAd: settings?.show_orduva_referral_ad !== false,
    socialFacebookUrl: settings?.social_facebook_url || null,
    socialInstagramUrl: settings?.social_instagram_url || null,
    socialTikTokUrl: settings?.social_tiktok_url || null,
    socialXUrl: settings?.social_x_url || null,
    socialWebsiteUrl: settings?.social_website_url || null,
    ...money,
  };
}
