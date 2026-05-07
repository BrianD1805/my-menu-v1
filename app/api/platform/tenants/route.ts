import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createTrialInsertFields } from "@/lib/trial";
import { hashOwnerPassword, normalizeOwnerEmail } from "@/lib/admin-auth";

type CurrencyDefaults = {
  currencyName: string;
  currencyCode: string;
  currencySymbol: string;
  currencySuffix?: string | null;
  currencyDisplayMode?: string;
  currencySymbolPosition?: string;
  currencyDecimalPlaces?: number;
  currencyUseThousandsSeparator?: boolean;
  currencyDecimalSeparator?: string;
  currencyThousandsSeparator?: string;
};

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "assets",
  "static",
  "www",
  "orduva", "zimzaexpress", "zimza-express",
  "localhost",
  "support",
  "help",
  "login",
  "platform",
]);

const COUNTRY_DEFAULTS: Record<string, CurrencyDefaults> = {
  GB: {
    currencyName: "British Pound",
    currencyCode: "GBP",
    currencySymbol: "£",
    currencyDisplayMode: "symbol",
    currencySymbolPosition: "before",
    currencyDecimalPlaces: 2,
    currencyUseThousandsSeparator: true,
    currencyDecimalSeparator: ".",
    currencyThousandsSeparator: ",",
  },
  ZA: {
    currencyName: "South African Rand",
    currencyCode: "ZAR",
    currencySymbol: "R",
    currencyDisplayMode: "symbol",
    currencySymbolPosition: "before",
    currencyDecimalPlaces: 2,
    currencyUseThousandsSeparator: true,
    currencyDecimalSeparator: ".",
    currencyThousandsSeparator: ",",
  },
  KE: {
    currencyName: "Kenyan Shilling",
    currencyCode: "KES",
    currencySymbol: "KES",
    currencyDisplayMode: "code",
    currencySymbolPosition: "before",
    currencyDecimalPlaces: 0,
    currencyUseThousandsSeparator: true,
    currencyDecimalSeparator: ".",
    currencyThousandsSeparator: ",",
    currencySuffix: "/-",
  },
};


function getPlatformKey() {
  return (process.env.ORDUVA_PLATFORM_ACCESS_KEY || process.env.ADMIN_ACCESS_KEY || "").trim();
}

function requirePlatformKey(req: Request) {
  const expected = getPlatformKey();
  const supplied = (req.headers.get("x-orduva-platform-key") || "").trim();
  if (!expected || supplied !== expected) {
    return NextResponse.json({ error: "Platform access key required" }, { status: 401 });
  }
  return null;
}

function normalizeSlug(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function normalizeOptionalText(value: unknown, maxLength: number) {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : null;
}

function looksLikeEmail(value: string | null) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getCountryCode(value: unknown) {
  const code = String(value || "").trim().toUpperCase();
  return code === "GB" || code === "ZA" || code === "KE" ? code : "GB";
}

function defaultThemeForCountry(countryCode: string) {
  if (countryCode === "ZA") {
    return { primaryColor: "#1F4F3A", accentColor: "#D69E2E", backgroundTint: "#F7F4EA", borderColor: "#D9C7A3", textColor: "#1F2A24" };
  }
  if (countryCode === "KE") {
    return { primaryColor: "#123C69", accentColor: "#E78A2F", backgroundTint: "#F6F9FC", borderColor: "#D9E3EC", textColor: "#1F2A37" };
  }
  return { primaryColor: "#2F5D8C", accentColor: "#F2A93B", backgroundTint: "#F6F9FC", borderColor: "#D9E3EC", textColor: "#1F2A37" };
}

export async function GET(req: Request) {
  const accessError = requirePlatformKey(req);
  if (accessError) return accessError;

  const { data, error } = await db
    .from("tenants")
    .select("id, name, slug, status, trial_status, trial_started_at, trial_ends_at, subscription_status, plan_name, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    return NextResponse.json({ error: "Failed to load tenants" }, { status: 500 });
  }

  return NextResponse.json({ tenants: data || [] });
}

export async function POST(req: Request) {
  const accessError = requirePlatformKey(req);
  if (accessError) return accessError;

  try {
    const body = await req.json();
    const businessName = normalizeOptionalText(body?.businessName, 120);
    const slug = normalizeSlug(body?.slug || businessName);
    const countryCode = getCountryCode(body?.countryCode);
    const contactPhone = normalizeOptionalText(body?.contactPhone, 80);
    const contactEmail = normalizeOptionalText(body?.contactEmail, 160);
    const contactWhatsApp = normalizeOptionalText(body?.contactWhatsApp, 80);
    const ownerName = normalizeOptionalText(body?.ownerName, 120);
    const ownerEmail = normalizeOwnerEmail(body?.ownerEmail);
    const ownerPassword = String(body?.ownerPassword || "");

    if (!businessName) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }
    if (!slug || slug.length < 3) {
      return NextResponse.json({ error: "Store address name must be at least 3 characters" }, { status: 400 });
    }
    if (RESERVED_SLUGS.has(slug)) {
      return NextResponse.json({ error: "That store address is reserved for Orduva platform routing. Please choose another." }, { status: 400 });
    }
    if (!looksLikeEmail(contactEmail)) {
      return NextResponse.json({ error: "Contact email does not look valid" }, { status: 400 });
    }
    if (!looksLikeEmail(ownerEmail)) {
      return NextResponse.json({ error: "Owner email does not look valid" }, { status: 400 });
    }
    if ((ownerEmail || ownerPassword) && (!ownerEmail || ownerPassword.length < 8)) {
      return NextResponse.json({ error: "Owner login needs an owner email and a temporary password of at least 8 characters" }, { status: 400 });
    }

    const { data: existing } = await db.from("tenants").select("id").eq("slug", slug).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "That store address is already in use" }, { status: 409 });
    }

    const { data: tenant, error: tenantError } = await db
      .from("tenants")
      .insert({
        name: businessName,
        slug,
        status: "setup",
        whatsapp_number: contactWhatsApp || contactPhone,
        ...createTrialInsertFields(),
      })
      .select("id, name, slug, status, trial_status, trial_started_at, trial_ends_at, subscription_status, plan_name, created_at")
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: tenantError?.message || "Failed to create store" }, { status: 500 });
    }

    const currency = COUNTRY_DEFAULTS[countryCode] || COUNTRY_DEFAULTS.GB;
    const theme = defaultThemeForCountry(countryCode);

    await db.from("tenant_settings").upsert(
      {
        tenant_id: tenant.id,
        business_display_name: businessName,
        storefront_heading: "Browse our menu",
        storefront_subheading: "Order online quickly and easily.",
        admin_heading_label: businessName,
        primary_color: theme.primaryColor,
        accent_color: theme.accentColor,
        background_tint: theme.backgroundTint,
        border_color: theme.borderColor,
        text_color: theme.textColor,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        contact_whatsapp: contactWhatsApp,
        footer_blurb: `Thank you for ordering with ${businessName}.`,
        footer_notice: "Prices and availability may change without notice.",
        currency_name: currency.currencyName,
        currency_code: currency.currencyCode,
        currency_symbol: currency.currencySymbol,
        currency_display_mode: currency.currencyDisplayMode,
        currency_symbol_position: currency.currencySymbolPosition,
        currency_decimal_places: currency.currencyDecimalPlaces,
        currency_use_thousands_separator: currency.currencyUseThousandsSeparator,
        currency_decimal_separator: currency.currencyDecimalSeparator,
        currency_thousands_separator: currency.currencyThousandsSeparator,
        currency_suffix: currency.currencySuffix || null,
      },
      { onConflict: "tenant_id" },
    );

    const { data: category } = await db
      .from("categories")
      .insert({ tenant_id: tenant.id, name: "Menu", sort_order: 10 })
      .select("id, name")
      .single();

    let ownerCreated = false;
    if (ownerEmail && ownerPassword) {
      const { error: ownerError } = await db.from("tenant_users").insert({
        tenant_id: tenant.id,
        email: ownerEmail,
        full_name: ownerName,
        role: "owner",
        password_hash: hashOwnerPassword(ownerPassword),
        is_active: true,
      });
      ownerCreated = !ownerError;
    }

    return NextResponse.json({
      tenant,
      starterCategory: category || null,
      ownerCreated,
      storefrontUrl: `https://${slug}.orduva.com`,
      adminUrl: `https://admin.orduva.com`,
      checklist: [
        "Store foundation created",
        "Open the generated store address",
        "Open shared admin and confirm the active store",
        "Upload logo and favicon",
        "Review storefront colours and currency formatting",
        "Add real categories and products",
        "Enable admin push notifications",
        "Place a test order from the store address",
        "Change the order status and confirm customer push updates",
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create store";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
