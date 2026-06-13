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
import {
  normalizeStorefrontTheme,
  type StorefrontTheme,
} from "@/lib/storefront-theme";

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
  account_business_legal_name?: string | null;
  account_contact_name?: string | null;
  account_phone?: string | null;
  account_email?: string | null;
  account_address_line_1?: string | null;
  account_address_line_2?: string | null;
  account_city?: string | null;
  account_region?: string | null;
  account_postcode?: string | null;
  account_country?: string | null;
  ship_from_name?: string | null;
  ship_from_address_line_1?: string | null;
  ship_from_address_line_2?: string | null;
  ship_from_city?: string | null;
  ship_from_region?: string | null;
  ship_from_postcode?: string | null;
  ship_from_country?: string | null;
  privacy_policy_title?: string | null;
  privacy_policy_body?: string | null;
  privacy_policy_show_on_storefront?: boolean | null;
  terms_of_service_title?: string | null;
  terms_of_service_body?: string | null;
  terms_of_service_show_on_storefront?: boolean | null;
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
  yoco_customer_mode: string | null;
  yoco_customer_account_label: string | null;
  yoco_customer_setup_notes: string | null;
  yoco_customer_webhook_id?: string | null;
  yoco_customer_webhook_url?: string | null;
  yoco_customer_payments_live: boolean | null;
  enable_mpesa_customer_payments: boolean | null;
  mpesa_connection_status: string | null;
  mpesa_customer_mode?: string | null;
  mpesa_customer_consumer_key?: string | null;
  mpesa_customer_consumer_secret_set?: boolean | null;
  mpesa_customer_consumer_secret_hint?: string | null;
  mpesa_customer_ipn_id?: string | null;
  mpesa_customer_account_label?: string | null;
  mpesa_customer_setup_notes?: string | null;
  mpesa_customer_payments_live?: boolean | null;
  enable_daraja_customer_payments?: boolean | null;
  daraja_connection_status?: string | null;
  daraja_customer_mode?: string | null;
  daraja_consumer_key?: string | null;
  daraja_consumer_secret_set?: boolean | null;
  daraja_consumer_secret_hint?: string | null;
  daraja_shortcode?: string | null;
  daraja_passkey_set?: boolean | null;
  daraja_passkey_hint?: string | null;
  daraja_transaction_type?: string | null;
  daraja_account_reference_prefix?: string | null;
  daraja_callback_url?: string | null;
  daraja_account_label?: string | null;
  daraja_setup_notes?: string | null;
  daraja_payments_live?: boolean | null;
  rewards_enabled?: boolean | null;
  rewards_program_name?: string | null;
  rewards_silver_min_spend?: number | null;
  rewards_silver_discount_percent?: number | null;
  rewards_gold_min_spend?: number | null;
  rewards_gold_discount_percent?: number | null;
  rewards_platinum_min_spend?: number | null;
  rewards_platinum_discount_percent?: number | null;
  preorders_enabled?: boolean | null;
  preorder_deposit_percent?: number | null;
  discounts_enabled?: boolean | null;
  discount_popup_enabled?: boolean | null;
  discount_popup_title?: string | null;
  discount_popup_message?: string | null;
  discount_rules?: unknown;
  receipt_document_name?: string | null;
  receipt_tax_label?: string | null;
  receipt_tax_number?: string | null;
  receipt_tax_rate_percent?: number | null;
  receipt_extra_field_1_enabled?: boolean | null;
  receipt_extra_field_1_label?: string | null;
  receipt_extra_field_1_value?: string | null;
  receipt_extra_field_2_enabled?: boolean | null;
  receipt_extra_field_2_label?: string | null;
  receipt_extra_field_2_value?: string | null;
  receipt_footer_message?: string | null;
  receipt_brand_image_mode?: string | null;
  seo_page_name?: string | null;
  seo_meta_description?: string | null;
  seo_keywords?: string | null;
  seo_canonical_url?: string | null;
  seo_structured_data_enabled?: boolean | null;
  google_tracking_id?: string | null;
  google_tag_manager_id?: string | null;
  invoice_payments_enabled?: boolean | null;
  invoice_payments_section_title?: string | null;
  invoice_payments_intro_text?: string | null;
  invoice_payments_invoice_enabled?: boolean | null;
  invoice_payments_deposit_enabled?: boolean | null;
  invoice_payments_balance_enabled?: boolean | null;
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

function asCurrencyDisplayModeOrNull(
  value: unknown,
): CurrencyDisplayMode | null {
  return value === "symbol" ||
    value === "code" ||
    value === "code_symbol" ||
    value === "symbol_code" ||
    value === "none"
    ? value
    : null;
}

function asCurrencySymbolPositionOrNull(
  value: unknown,
): CurrencySymbolPosition | null {
  return value === "before" || value === "after" ? value : null;
}

export function normalizeCurrencyCode(value: unknown) {
  const code = String(value || "")
    .trim()
    .toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : null;
}

export function normalizeCurrencyDisplayMode(
  value: unknown,
): CurrencyDisplayMode | null {
  const mode = String(value || "")
    .trim()
    .toLowerCase();
  return ["symbol", "code", "code_symbol", "symbol_code", "none"].includes(mode)
    ? (mode as CurrencyDisplayMode)
    : null;
}

export function normalizeCurrencySymbolPosition(
  value: unknown,
): CurrencySymbolPosition | null {
  const position = String(value || "")
    .trim()
    .toLowerCase();
  return position === "before" || position === "after"
    ? (position as CurrencySymbolPosition)
    : null;
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

const SETTINGS_SELECT =
  "tenant_id, business_display_name, storefront_heading, storefront_subheading, admin_heading_label, logo_url, favicon_url, primary_color, accent_color, background_tint, border_color, text_color, storefront_theme_json, contact_phone, contact_email, contact_whatsapp, contact_address, account_business_legal_name, account_contact_name, account_phone, account_email, account_address_line_1, account_address_line_2, account_city, account_region, account_postcode, account_country, ship_from_name, ship_from_address_line_1, ship_from_address_line_2, ship_from_city, ship_from_region, ship_from_postcode, ship_from_country, privacy_policy_title, privacy_policy_body, privacy_policy_show_on_storefront, terms_of_service_title, terms_of_service_body, terms_of_service_show_on_storefront, footer_blurb, footer_notice, show_orduva_referral_ad, social_facebook_url, social_instagram_url, social_tiktok_url, social_x_url, social_website_url, currency_name, currency_code, currency_symbol, currency_display_mode, currency_symbol_position, currency_decimal_places, currency_use_thousands_separator, currency_decimal_separator, currency_thousands_separator, currency_suffix, enable_cash_on_collection, enable_cash_on_delivery, enable_stripe_customer_payments, stripe_connection_status, stripe_customer_payment_mode, stripe_customer_publishable_key, stripe_customer_account_label, stripe_customer_test_mode, stripe_customer_setup_notes, stripe_customer_payments_live, enable_yoco_customer_payments, yoco_connection_status, yoco_customer_mode, yoco_customer_account_label, yoco_customer_setup_notes, yoco_customer_webhook_id, yoco_customer_webhook_url, yoco_customer_payments_live, enable_mpesa_customer_payments, mpesa_connection_status, mpesa_customer_mode, mpesa_customer_consumer_key, mpesa_customer_ipn_id, mpesa_customer_account_label, mpesa_customer_setup_notes, mpesa_customer_payments_live, enable_daraja_customer_payments, daraja_connection_status, daraja_customer_mode, daraja_consumer_key, daraja_shortcode, daraja_transaction_type, daraja_account_reference_prefix, daraja_callback_url, daraja_account_label, daraja_setup_notes, daraja_payments_live, rewards_enabled, rewards_program_name, rewards_silver_min_spend, rewards_silver_discount_percent, rewards_gold_min_spend, rewards_gold_discount_percent, rewards_platinum_min_spend, rewards_platinum_discount_percent, preorders_enabled, preorder_deposit_percent, discounts_enabled, discount_popup_enabled, discount_popup_title, discount_popup_message, discount_rules, receipt_document_name, receipt_tax_label, receipt_tax_number, receipt_tax_rate_percent, receipt_extra_field_1_enabled, receipt_extra_field_1_label, receipt_extra_field_1_value, receipt_extra_field_2_enabled, receipt_extra_field_2_label, receipt_extra_field_2_value, receipt_footer_message, receipt_brand_image_mode, seo_page_name, seo_meta_description, seo_keywords, seo_canonical_url, seo_structured_data_enabled, google_tracking_id, google_tag_manager_id, invoice_payments_enabled, invoice_payments_section_title, invoice_payments_intro_text, invoice_payments_invoice_enabled, invoice_payments_deposit_enabled, invoice_payments_balance_enabled";

export async function getTenantSettings(
  tenantId: string,
): Promise<TenantSettings | null> {
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
    background_tint: asStringOrNull(
      (data as Record<string, unknown>).background_tint,
    ),
    border_color: asStringOrNull(
      (data as Record<string, unknown>).border_color,
    ),
    text_color: asStringOrNull((data as Record<string, unknown>).text_color),
    storefront_theme_json: normalizeStorefrontTheme(
      (data as Record<string, unknown>).storefront_theme_json,
    ),
    contact_phone: asStringOrNull(
      (data as Record<string, unknown>).contact_phone,
    ),
    contact_email: asStringOrNull(
      (data as Record<string, unknown>).contact_email,
    ),
    contact_whatsapp: asStringOrNull(
      (data as Record<string, unknown>).contact_whatsapp,
    ),
    contact_address: asStringOrNull(
      (data as Record<string, unknown>).contact_address,
    ),
    account_business_legal_name: asStringOrNull((data as Record<string, unknown>).account_business_legal_name),
    account_contact_name: asStringOrNull((data as Record<string, unknown>).account_contact_name),
    account_phone: asStringOrNull((data as Record<string, unknown>).account_phone),
    account_email: asStringOrNull((data as Record<string, unknown>).account_email),
    account_address_line_1: asStringOrNull((data as Record<string, unknown>).account_address_line_1),
    account_address_line_2: asStringOrNull((data as Record<string, unknown>).account_address_line_2),
    account_city: asStringOrNull((data as Record<string, unknown>).account_city),
    account_region: asStringOrNull((data as Record<string, unknown>).account_region),
    account_postcode: asStringOrNull((data as Record<string, unknown>).account_postcode),
    account_country: asStringOrNull((data as Record<string, unknown>).account_country),
    ship_from_name: asStringOrNull((data as Record<string, unknown>).ship_from_name),
    ship_from_address_line_1: asStringOrNull((data as Record<string, unknown>).ship_from_address_line_1),
    ship_from_address_line_2: asStringOrNull((data as Record<string, unknown>).ship_from_address_line_2),
    ship_from_city: asStringOrNull((data as Record<string, unknown>).ship_from_city),
    ship_from_region: asStringOrNull((data as Record<string, unknown>).ship_from_region),
    ship_from_postcode: asStringOrNull((data as Record<string, unknown>).ship_from_postcode),
    ship_from_country: asStringOrNull((data as Record<string, unknown>).ship_from_country),
    privacy_policy_title: asStringOrNull((data as Record<string, unknown>).privacy_policy_title),
    privacy_policy_body: asStringOrNull((data as Record<string, unknown>).privacy_policy_body),
    privacy_policy_show_on_storefront: asBooleanOrNull((data as Record<string, unknown>).privacy_policy_show_on_storefront),
    terms_of_service_title: asStringOrNull((data as Record<string, unknown>).terms_of_service_title),
    terms_of_service_body: asStringOrNull((data as Record<string, unknown>).terms_of_service_body),
    terms_of_service_show_on_storefront: asBooleanOrNull((data as Record<string, unknown>).terms_of_service_show_on_storefront),
    footer_blurb: asStringOrNull(
      (data as Record<string, unknown>).footer_blurb,
    ),
    footer_notice: asStringOrNull(
      (data as Record<string, unknown>).footer_notice,
    ),
    show_orduva_referral_ad: asBooleanOrNull(
      (data as Record<string, unknown>).show_orduva_referral_ad,
    ),
    social_facebook_url: asStringOrNull(
      (data as Record<string, unknown>).social_facebook_url,
    ),
    social_instagram_url: asStringOrNull(
      (data as Record<string, unknown>).social_instagram_url,
    ),
    social_tiktok_url: asStringOrNull(
      (data as Record<string, unknown>).social_tiktok_url,
    ),
    social_x_url: asStringOrNull(
      (data as Record<string, unknown>).social_x_url,
    ),
    social_website_url: asStringOrNull(
      (data as Record<string, unknown>).social_website_url,
    ),
    currency_name: asStringOrNull(
      (data as Record<string, unknown>).currency_name,
    ),
    currency_code: asStringOrNull(
      (data as Record<string, unknown>).currency_code,
    ),
    currency_symbol: asStringOrNull(
      (data as Record<string, unknown>).currency_symbol,
    ),
    currency_display_mode: asCurrencyDisplayModeOrNull(
      (data as Record<string, unknown>).currency_display_mode,
    ),
    currency_symbol_position: asCurrencySymbolPositionOrNull(
      (data as Record<string, unknown>).currency_symbol_position,
    ),
    currency_decimal_places: asNumberOrNull(
      (data as Record<string, unknown>).currency_decimal_places,
    ),
    currency_use_thousands_separator: asBooleanOrNull(
      (data as Record<string, unknown>).currency_use_thousands_separator,
    ),
    currency_decimal_separator: asStringOrNull(
      (data as Record<string, unknown>).currency_decimal_separator,
    ),
    currency_thousands_separator: asStringOrNull(
      (data as Record<string, unknown>).currency_thousands_separator,
    ),
    currency_suffix: asStringOrNull(
      (data as Record<string, unknown>).currency_suffix,
    ),
    enable_cash_on_collection: asBooleanOrNull(
      (data as Record<string, unknown>).enable_cash_on_collection,
    ),
    enable_cash_on_delivery: asBooleanOrNull(
      (data as Record<string, unknown>).enable_cash_on_delivery,
    ),
    enable_stripe_customer_payments: asBooleanOrNull(
      (data as Record<string, unknown>).enable_stripe_customer_payments,
    ),
    stripe_connection_status: asStringOrNull(
      (data as Record<string, unknown>).stripe_connection_status,
    ),
    stripe_customer_payment_mode: asStringOrNull(
      (data as Record<string, unknown>).stripe_customer_payment_mode,
    ),
    stripe_customer_publishable_key: asStringOrNull(
      (data as Record<string, unknown>).stripe_customer_publishable_key,
    ),
    stripe_customer_account_label: asStringOrNull(
      (data as Record<string, unknown>).stripe_customer_account_label,
    ),
    stripe_customer_test_mode: asBooleanOrNull(
      (data as Record<string, unknown>).stripe_customer_test_mode,
    ),
    stripe_customer_setup_notes: asStringOrNull(
      (data as Record<string, unknown>).stripe_customer_setup_notes,
    ),
    stripe_customer_payments_live: asBooleanOrNull(
      (data as Record<string, unknown>).stripe_customer_payments_live,
    ),
    enable_yoco_customer_payments: asBooleanOrNull(
      (data as Record<string, unknown>).enable_yoco_customer_payments,
    ),
    yoco_connection_status: asStringOrNull(
      (data as Record<string, unknown>).yoco_connection_status,
    ),
    yoco_customer_mode: asStringOrNull(
      (data as Record<string, unknown>).yoco_customer_mode,
    ),
    yoco_customer_account_label: asStringOrNull(
      (data as Record<string, unknown>).yoco_customer_account_label,
    ),
    yoco_customer_setup_notes: asStringOrNull(
      (data as Record<string, unknown>).yoco_customer_setup_notes,
    ),
    yoco_customer_webhook_id: asStringOrNull(
      (data as Record<string, unknown>).yoco_customer_webhook_id,
    ),
    yoco_customer_webhook_url: asStringOrNull(
      (data as Record<string, unknown>).yoco_customer_webhook_url,
    ),
    yoco_customer_payments_live: asBooleanOrNull(
      (data as Record<string, unknown>).yoco_customer_payments_live,
    ),
    enable_mpesa_customer_payments: asBooleanOrNull(
      (data as Record<string, unknown>).enable_mpesa_customer_payments,
    ),
    mpesa_connection_status: asStringOrNull(
      (data as Record<string, unknown>).mpesa_connection_status,
    ),
    mpesa_customer_mode: asStringOrNull(
      (data as Record<string, unknown>).mpesa_customer_mode,
    ),
    mpesa_customer_consumer_key: asStringOrNull(
      (data as Record<string, unknown>).mpesa_customer_consumer_key,
    ),
    mpesa_customer_ipn_id: asStringOrNull(
      (data as Record<string, unknown>).mpesa_customer_ipn_id,
    ),
    mpesa_customer_account_label: asStringOrNull(
      (data as Record<string, unknown>).mpesa_customer_account_label,
    ),
    mpesa_customer_setup_notes: asStringOrNull(
      (data as Record<string, unknown>).mpesa_customer_setup_notes,
    ),
    mpesa_customer_payments_live: asBooleanOrNull(
      (data as Record<string, unknown>).mpesa_customer_payments_live,
    ),
    enable_daraja_customer_payments: asBooleanOrNull(
      (data as Record<string, unknown>).enable_daraja_customer_payments,
    ),
    daraja_connection_status: asStringOrNull(
      (data as Record<string, unknown>).daraja_connection_status,
    ),
    daraja_customer_mode: asStringOrNull(
      (data as Record<string, unknown>).daraja_customer_mode,
    ),
    daraja_consumer_key: asStringOrNull(
      (data as Record<string, unknown>).daraja_consumer_key,
    ),
    daraja_shortcode: asStringOrNull(
      (data as Record<string, unknown>).daraja_shortcode,
    ),
    daraja_transaction_type: asStringOrNull(
      (data as Record<string, unknown>).daraja_transaction_type,
    ),
    daraja_account_reference_prefix: asStringOrNull(
      (data as Record<string, unknown>).daraja_account_reference_prefix,
    ),
    daraja_callback_url: asStringOrNull(
      (data as Record<string, unknown>).daraja_callback_url,
    ),
    daraja_account_label: asStringOrNull(
      (data as Record<string, unknown>).daraja_account_label,
    ),
    daraja_setup_notes: asStringOrNull(
      (data as Record<string, unknown>).daraja_setup_notes,
    ),
    daraja_payments_live: asBooleanOrNull(
      (data as Record<string, unknown>).daraja_payments_live,
    ),
    rewards_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).rewards_enabled,
    ),
    rewards_program_name: asStringOrNull(
      (data as Record<string, unknown>).rewards_program_name,
    ),
    rewards_silver_min_spend: asNumberOrNull(
      (data as Record<string, unknown>).rewards_silver_min_spend,
    ),
    rewards_silver_discount_percent: asNumberOrNull(
      (data as Record<string, unknown>).rewards_silver_discount_percent,
    ),
    rewards_gold_min_spend: asNumberOrNull(
      (data as Record<string, unknown>).rewards_gold_min_spend,
    ),
    rewards_gold_discount_percent: asNumberOrNull(
      (data as Record<string, unknown>).rewards_gold_discount_percent,
    ),
    rewards_platinum_min_spend: asNumberOrNull(
      (data as Record<string, unknown>).rewards_platinum_min_spend,
    ),
    rewards_platinum_discount_percent: asNumberOrNull(
      (data as Record<string, unknown>).rewards_platinum_discount_percent,
    ),
    preorders_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).preorders_enabled,
    ),
    preorder_deposit_percent: asNumberOrNull(
      (data as Record<string, unknown>).preorder_deposit_percent,
    ),
    discounts_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).discounts_enabled,
    ),
    discount_popup_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).discount_popup_enabled,
    ),
    discount_popup_title: asStringOrNull(
      (data as Record<string, unknown>).discount_popup_title,
    ),
    discount_popup_message: asStringOrNull(
      (data as Record<string, unknown>).discount_popup_message,
    ),
    discount_rules: (data as Record<string, unknown>).discount_rules || [],
    receipt_document_name: asStringOrNull(
      (data as Record<string, unknown>).receipt_document_name,
    ),
    receipt_tax_label: asStringOrNull(
      (data as Record<string, unknown>).receipt_tax_label,
    ),
    receipt_tax_number: asStringOrNull(
      (data as Record<string, unknown>).receipt_tax_number,
    ),
    receipt_tax_rate_percent: asNumberOrNull(
      (data as Record<string, unknown>).receipt_tax_rate_percent,
    ),
    receipt_extra_field_1_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).receipt_extra_field_1_enabled,
    ),
    receipt_extra_field_1_label: asStringOrNull(
      (data as Record<string, unknown>).receipt_extra_field_1_label,
    ),
    receipt_extra_field_1_value: asStringOrNull(
      (data as Record<string, unknown>).receipt_extra_field_1_value,
    ),
    receipt_extra_field_2_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).receipt_extra_field_2_enabled,
    ),
    receipt_extra_field_2_label: asStringOrNull(
      (data as Record<string, unknown>).receipt_extra_field_2_label,
    ),
    receipt_extra_field_2_value: asStringOrNull(
      (data as Record<string, unknown>).receipt_extra_field_2_value,
    ),
    receipt_footer_message: asStringOrNull(
      (data as Record<string, unknown>).receipt_footer_message,
    ),
    receipt_brand_image_mode: asStringOrNull(
      (data as Record<string, unknown>).receipt_brand_image_mode,
    ),
    seo_page_name: asStringOrNull(
      (data as Record<string, unknown>).seo_page_name,
    ),
    seo_meta_description: asStringOrNull(
      (data as Record<string, unknown>).seo_meta_description,
    ),
    seo_keywords: asStringOrNull(
      (data as Record<string, unknown>).seo_keywords,
    ),
    seo_canonical_url: asStringOrNull(
      (data as Record<string, unknown>).seo_canonical_url,
    ),
    seo_structured_data_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).seo_structured_data_enabled,
    ),
    google_tracking_id: asStringOrNull(
      (data as Record<string, unknown>).google_tracking_id,
    ),
    google_tag_manager_id: asStringOrNull(
      (data as Record<string, unknown>).google_tag_manager_id,
    ),
    invoice_payments_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).invoice_payments_enabled,
    ),
    invoice_payments_section_title: asStringOrNull(
      (data as Record<string, unknown>).invoice_payments_section_title,
    ),
    invoice_payments_intro_text: asStringOrNull(
      (data as Record<string, unknown>).invoice_payments_intro_text,
    ),
    invoice_payments_invoice_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).invoice_payments_invoice_enabled,
    ),
    invoice_payments_deposit_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).invoice_payments_deposit_enabled,
    ),
    invoice_payments_balance_enabled: asBooleanOrNull(
      (data as Record<string, unknown>).invoice_payments_balance_enabled,
    ),
  };
}

export function buildTenantBranding(
  slug: string,
  tenantName: string,
  settings: TenantSettings | null,
): ReturnType<typeof _buildTenantBranding>;
export function buildTenantBranding(
  tenantName: string,
  settings: TenantSettings | null,
): ReturnType<typeof _buildTenantBranding>;
export function buildTenantBranding(
  arg1: string,
  arg2: string | TenantSettings | null,
  arg3?: TenantSettings | null,
) {
  if (typeof arg2 === "string") {
    return _buildTenantBranding(arg1, arg2, arg3 ?? null);
  }
  return _buildTenantBranding("", arg1, arg2 ?? null);
}

function _buildTenantBranding(
  slug: string,
  tenantName: string,
  settings: TenantSettings | null,
) {
  const defaults = getTenantBrandDefaults(slug);
  const displayName = settings?.business_display_name || tenantName;
  const money = buildMoneySettings({
    currencyName: settings?.currency_name || DEFAULT_CURRENCY_NAME,
    currencyCode: settings?.currency_code || DEFAULT_CURRENCY_CODE,
    currencySymbol: settings?.currency_symbol || DEFAULT_CURRENCY_SYMBOL,
    currencyDisplayMode:
      settings?.currency_display_mode || DEFAULT_CURRENCY_DISPLAY_MODE,
    currencySymbolPosition:
      settings?.currency_symbol_position || DEFAULT_CURRENCY_SYMBOL_POSITION,
    currencyDecimalPlaces:
      settings?.currency_decimal_places ?? DEFAULT_CURRENCY_DECIMAL_PLACES,
    currencyUseThousandsSeparator:
      settings?.currency_use_thousands_separator ??
      DEFAULT_CURRENCY_USE_THOUSANDS_SEPARATOR,
    currencyDecimalSeparator:
      settings?.currency_decimal_separator ||
      DEFAULT_CURRENCY_DECIMAL_SEPARATOR,
    currencyThousandsSeparator:
      settings?.currency_thousands_separator ||
      DEFAULT_CURRENCY_THOUSANDS_SEPARATOR,
    currencySuffix: settings?.currency_suffix ?? DEFAULT_CURRENCY_SUFFIX,
  });

  return {
    displayName,
    storefrontHeading: settings?.storefront_heading || "Browse the menu",
    storefrontSubheading:
      settings?.storefront_subheading ||
      "Tap into the details for more information, or add favourites straight to your order.",
    adminHeadingLabel: settings?.admin_heading_label || displayName,
    logoUrl: settings?.logo_url || defaults.starterLogoUrl,
    faviconUrl: settings?.favicon_url || defaults.starterFaviconUrl,
    primaryColor:
      settings?.primary_color || defaults.primaryColor || DEFAULT_PRIMARY_COLOR,
    accentColor:
      settings?.accent_color || defaults.accentColor || DEFAULT_ACCENT_COLOR,
    backgroundTint: settings?.background_tint || "#F8F4F0",
    borderColor: settings?.border_color || "#D9C7A3",
    textColor: settings?.text_color || "#2B2B2B",
    storefrontTheme: settings?.storefront_theme_json || null,
    contactPhone: settings?.contact_phone || null,
    contactEmail: settings?.contact_email || null,
    contactWhatsApp: settings?.contact_whatsapp || null,
    contactAddress: settings?.contact_address || null,
    privacyPolicyTitle: settings?.privacy_policy_title || "Privacy Policy",
    privacyPolicyBody: settings?.privacy_policy_body || null,
    privacyPolicyShowOnStorefront: settings?.privacy_policy_show_on_storefront !== false,
    termsOfServiceTitle: settings?.terms_of_service_title || "Terms of Service",
    termsOfServiceBody: settings?.terms_of_service_body || null,
    termsOfServiceShowOnStorefront: settings?.terms_of_service_show_on_storefront !== false,
    footerBlurb: settings?.footer_blurb || "Thank you for ordering with us.",
    footerNotice:
      settings?.footer_notice ||
      "Prices and availability may change without notice.",
    showOrduvaReferralAd: settings?.show_orduva_referral_ad !== false,
    socialFacebookUrl: settings?.social_facebook_url || null,
    socialInstagramUrl: settings?.social_instagram_url || null,
    socialTikTokUrl: settings?.social_tiktok_url || null,
    socialXUrl: settings?.social_x_url || null,
    socialWebsiteUrl: settings?.social_website_url || null,
    ...money,
  };
}
