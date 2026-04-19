import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";

async function getTenant(tenantSlug: string) {
  const { data: tenant, error: tenantError } = await db
    .from("tenants")
    .select("id, name")
    .eq("slug", tenantSlug)
    .single();

  if (tenantError || !tenant) {
    return { error: NextResponse.json({ error: "Tenant not found" }, { status: 404 }) };
  }

  return { tenant };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantSlug = searchParams.get("tenantSlug");

  if (!tenantSlug) {
    return NextResponse.json({ error: "Missing tenantSlug" }, { status: 400 });
  }

  const tenantLookup = await getTenant(tenantSlug);
  if (tenantLookup.error) return tenantLookup.error;

  const { data: products, error } = await db
    .from("products")
    .select("id, name, description, image_url, price, is_active, category_id")
    .eq("tenant_id", tenantLookup.tenant.id)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }

  const settings = await getTenantSettings(tenantLookup.tenant.id);
  const branding = buildTenantBranding(tenantLookup.tenant.slug, tenantLookup.tenant.name, settings);

  return NextResponse.json({
    products,
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
    },
  });
}
