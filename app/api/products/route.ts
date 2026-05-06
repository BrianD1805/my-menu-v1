import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { startLoadTimer } from "@/lib/load-diagnostics";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

async function getTenant(tenantSlug: string) {
  const tenantTimer = startLoadTimer("api/products tenant lookup");
  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", tenantSlug)
    .single();
  tenantTimer.end({ tenantSlug, found: Boolean(tenant) });

  if (!tenantError && tenant) {
    return { tenant };
  }

  // Ver-0.170 keeps the same public demo fallback used by the server route.
  if (tenantSlug === "zimzaexpress") {
    const legacyResult = await db
      .from("tenants")
      .select("id, slug, name")
      .eq("slug", "orduva")
      .single();

    if (!legacyResult.error && legacyResult.data) {
      return { tenant: legacyResult.data };
    }
  }

  return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
}

export async function GET(req: Request) {
  const totalTimer = startLoadTimer("api/products total");
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");

  if (!tenantSlug) {
    return NextResponse.json({ error: "Missing tenantSlug" }, { status: 400 });
  }

  const tenantLookup = await getTenant(tenantSlug);
  if (tenantLookup.error) return tenantLookup.error;
  const tenant = tenantLookup.tenant!;

  const dataTimer = startLoadTimer("api/products products/categories/settings parallel load");
  const [productsResult, categoriesResult, settings] = await Promise.all([
    db
      .from("products")
      .select("id, name, description, image_url, price, is_active, category_id, stock_enabled, stock_quantity, low_stock_threshold")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    db
      .from("categories")
      .select("id, name, sort_order")
      .eq("tenant_id", tenant.id)
      .order("sort_order", { ascending: true }),
    getTenantSettings(tenant.id),
  ]);
  dataTimer.end({
    products: productsResult.data?.length || 0,
    categories: categoriesResult.data?.length || 0,
    productsError: Boolean(productsResult.error),
    categoriesError: Boolean(categoriesResult.error),
  });

  if (productsResult.error || categoriesResult.error) {
    return NextResponse.json({ error: "Failed to load storefront data" }, { status: 500 });
  }

  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  totalTimer.end({ tenantSlug });

  const payload = {
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
    },
    categories: categoriesResult.data || [],
    products: productsResult.data || [],
    settings: {
      tenantId: tenant.id,
      tenantName: tenant.name,
      logoUrl: branding.logoUrl,
      storefrontHeading: branding.storefrontHeading,
      storefrontSubheading: branding.storefrontSubheading,
      currencyName: branding.currencyName,
      currencyCode: branding.currencyCode,
      currencySymbol: branding.currencySymbol,
      currencyDisplayMode: branding.currencyDisplayMode,
      currencySymbolPosition: branding.currencySymbolPosition,
      currencyDecimalPlaces: branding.currencyDecimalPlaces,
      currencyUseThousandsSeparator: branding.currencyUseThousandsSeparator,
      currencyDecimalSeparator: branding.currencyDecimalSeparator,
      currencyThousandsSeparator: branding.currencyThousandsSeparator,
      currencySuffix: branding.currencySuffix,
      displayName: branding.displayName,
      contactPhone: branding.contactPhone,
      contactEmail: branding.contactEmail,
      contactWhatsApp: branding.contactWhatsApp,
      contactAddress: branding.contactAddress,
      footerBlurb: branding.footerBlurb,
      footerNotice: branding.footerNotice,
      socialFacebookUrl: branding.socialFacebookUrl,
      socialInstagramUrl: branding.socialInstagramUrl,
      socialTikTokUrl: branding.socialTikTokUrl,
      socialXUrl: branding.socialXUrl,
      socialWebsiteUrl: branding.socialWebsiteUrl,
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      backgroundTint: branding.backgroundTint,
      borderColor: branding.borderColor,
      textColor: branding.textColor,
      storefrontTheme: branding.storefrontTheme,
    },
  };

  return NextResponse.json(payload, {
    headers: {
      // Ver-0.172: this menu data is public tenant storefront data, so it can
      // be cached briefly at the edge and reused by the storefront service
      // worker/local cache while fresh data is refreshed in the background.
      "Cache-Control": "public, s-maxage=90, stale-while-revalidate=600",
    },
  });
}
