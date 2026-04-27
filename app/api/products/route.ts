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

  if (tenantError || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
  }

  return { tenant };
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

  const dataTimer = startLoadTimer("api/products products/settings parallel load");
  const [productsResult, settings] = await Promise.all([
    db
      .from("products")
      .select("id, name, description, image_url, price, is_active, category_id")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    getTenantSettings(tenant.id),
  ]);
  dataTimer.end({ products: productsResult.data?.length || 0, productsError: Boolean(productsResult.error) });

  if (productsResult.error) {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }

  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  totalTimer.end({ tenantSlug });

  return NextResponse.json({
    products: productsResult.data || [],
    settings: {
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
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      backgroundTint: branding.backgroundTint,
      borderColor: branding.borderColor,
      textColor: branding.textColor,
    },
  });
}
