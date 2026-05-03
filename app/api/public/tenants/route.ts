import { NextResponse } from "next/server";
import { db } from "@/lib/db";
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

type PublicOnboardingWindow = { count: number; resetAt: number };

const PUBLIC_ONBOARDING_RATE_LIMIT = new Map<string, PublicOnboardingWindow>();
const PUBLIC_ONBOARDING_WINDOW_MS = 60 * 60 * 1000;
const PUBLIC_ONBOARDING_MAX_PER_WINDOW = 5;
const PUBLIC_ONBOARDING_MIN_FORM_MS = 3000;

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

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const current = PUBLIC_ONBOARDING_RATE_LIMIT.get(key);
  if (!current || current.resetAt < now) {
    PUBLIC_ONBOARDING_RATE_LIMIT.set(key, { count: 1, resetAt: now + PUBLIC_ONBOARDING_WINDOW_MS });
    return true;
  }
  if (current.count >= PUBLIC_ONBOARDING_MAX_PER_WINDOW) return false;
  current.count += 1;
  return true;
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clientIp = getClientIp(req);
    const botTrap = String(body?.website || "").trim();
    if (botTrap) {
      return NextResponse.json({ error: "Unable to create store" }, { status: 400 });
    }

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json({ error: "Too many store setup attempts from this connection. Please try again later." }, { status: 429 });
    }

    const formStartedAt = Number(body?.formStartedAt || 0);
    if (!formStartedAt || Date.now() - formStartedAt < PUBLIC_ONBOARDING_MIN_FORM_MS) {
      return NextResponse.json({ error: "Please take a moment to complete the form before submitting." }, { status: 400 });
    }

    if (body?.acceptedTerms !== true || body?.privacyAccepted !== true || body?.humanConfirmed !== true) {
      return NextResponse.json({ error: "Please accept the setup terms and confirm this is a genuine business store." }, { status: 400 });
    }

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
    if (!ownerName || !ownerEmail || ownerPassword.length < 8) {
      return NextResponse.json({ error: "Your owner login needs your name, email and a password of at least 8 characters" }, { status: 400 });
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
      })
      .select("id, name, slug, status, created_at")
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

    const { error: ownerError } = await db.from("tenant_users").insert({
      tenant_id: tenant.id,
      email: ownerEmail,
      full_name: ownerName,
      role: "owner",
      password_hash: hashOwnerPassword(ownerPassword),
      is_active: true,
    });

    if (ownerError) {
      return NextResponse.json({ error: ownerError.message || "Store created, but owner login could not be created" }, { status: 500 });
    }

    return NextResponse.json({
      tenant,
      starterCategory: category || null,
      ownerCreated: true,
      storefrontUrl: `https://${slug}.orduva.com`,
      adminUrl: `https://admin.orduva.com`,
      checklist: [
        "Your Orduva store foundation has been created",
        "Your setup consent was recorded with this request",
        "Open your new store address and check the starter store loads",
        "Sign in to admin using the owner email and password you just created",
        "Add your real categories, products, prices and product photos",
        "Upload your logo, check your colours, and confirm your currency",
        "Enable admin order notifications when you are ready to test orders",
        "Place one test order before sharing your store address with customers",
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create store";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
