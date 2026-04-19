import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveAdminTenant } from "@/lib/admin-tenant";
import {
  normalizeBoolean,
  normalizeColor,
  normalizeCurrencyCode,
  normalizeCurrencyDecimalPlaces,
  normalizeCurrencyDisplayMode,
  normalizeCurrencySymbolPosition,
  normalizeOptionalText,
  normalizeSeparator,
} from "@/lib/tenant-settings";

const SETTINGS_SELECT = "tenant_id, business_display_name, storefront_heading, storefront_subheading, admin_heading_label, logo_url, primary_color, accent_color, contact_phone, contact_email, contact_whatsapp, contact_address, footer_blurb, footer_notice, currency_name, currency_code, currency_symbol, currency_display_mode, currency_symbol_position, currency_decimal_places, currency_use_thousands_separator, currency_decimal_separator, currency_thousands_separator, currency_suffix";

export async function GET(req: Request) {
  const tenantLookup = await resolveAdminTenant(req);
  if (!tenantLookup.ok) return tenantLookup.error;

  const { data, error } = await db
    .from("tenant_settings")
    .select(SETTINGS_SELECT)
    .eq("tenant_id", tenantLookup.tenant.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Failed to load tenant settings" }, { status: 500 });
  }

  return NextResponse.json({ settings: data || null });
}

export async function PATCH(req: Request) {
  try {
    const tenantLookup = await resolveAdminTenant(req);
    if (!tenantLookup.ok) return tenantLookup.error;

    const body = await req.json();
    const payload = {
      tenant_id: tenantLookup.tenant.id,
      business_display_name: normalizeOptionalText(body?.businessDisplayName, 120),
      storefront_heading: normalizeOptionalText(body?.storefrontHeading, 160),
      storefront_subheading: normalizeOptionalText(body?.storefrontSubheading, 400),
      admin_heading_label: normalizeOptionalText(body?.adminHeadingLabel, 120),
      logo_url: normalizeOptionalText(body?.logoUrl, 500),
      favicon_url: normalizeOptionalText(body?.faviconUrl, 500),
      primary_color: normalizeColor(body?.primaryColor),
      accent_color: normalizeColor(body?.accentColor),
      contact_phone: normalizeOptionalText(body?.contactPhone, 80),
      contact_email: normalizeOptionalText(body?.contactEmail, 160),
      contact_whatsapp: normalizeOptionalText(body?.contactWhatsApp, 80),
      contact_address: normalizeOptionalText(body?.contactAddress, 240),
      footer_blurb: normalizeOptionalText(body?.footerBlurb, 240),
      footer_notice: normalizeOptionalText(body?.footerNotice, 240),
      currency_name: normalizeOptionalText(body?.currencyName, 80),
      currency_code: normalizeCurrencyCode(body?.currencyCode),
      currency_symbol: normalizeOptionalText(body?.currencySymbol, 12),
      currency_display_mode: normalizeCurrencyDisplayMode(body?.currencyDisplayMode),
      currency_symbol_position: normalizeCurrencySymbolPosition(body?.currencySymbolPosition),
      currency_decimal_places: normalizeCurrencyDecimalPlaces(body?.currencyDecimalPlaces),
      currency_use_thousands_separator: normalizeBoolean(body?.currencyUseThousandsSeparator),
      currency_decimal_separator: normalizeSeparator(body?.currencyDecimalSeparator),
      currency_thousands_separator: normalizeSeparator(body?.currencyThousandsSeparator),
      currency_suffix: normalizeOptionalText(body?.currencySuffix, 12),
    };

    const { data, error } = await db
      .from("tenant_settings")
      .upsert(payload, { onConflict: "tenant_id" })
      .select(SETTINGS_SELECT)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to save tenant settings" }, { status: 500 });
    }

    return NextResponse.json({ settings: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save tenant settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
