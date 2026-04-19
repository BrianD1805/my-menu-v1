import MenuBrowser from "@/components/menu/MenuBrowser";
import { db } from "@/lib/db";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { LIVE_VERSION } from "@/lib/version";

export default async function HomePage() {
  const slug = await resolveTenantSlug();
  const tenant = await getTenantBySlug(slug);
  const settings = await getTenantSettings(tenant.id);
  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);

  const { data: categories } = await db
    .from("categories")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("sort_order", { ascending: true });

  const { data: products } = await db
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true);

  return (
    <main className="mx-auto min-h-screen max-w-7xl overflow-x-clip px-4 pb-10 pt-0 sm:px-5 lg:px-6">
      <MenuBrowser
        tenantSlug={slug}
        tenantName={branding.displayName}
        version={LIVE_VERSION}
        categories={categories || []}
        products={products || []}
        logoUrl={branding.logoUrl}
        headerLogoUrl={branding.logoUrl}
        welcomeHeading={branding.storefrontHeading}
        welcomeSubheading={branding.storefrontSubheading}
        primaryColor={branding.primaryColor}
        accentColor={branding.accentColor}
        backgroundTint={branding.backgroundTint}
        borderColor={branding.borderColor}
        textColor={branding.textColor}
        contactPhone={branding.contactPhone}
        contactEmail={branding.contactEmail}
        contactWhatsApp={branding.contactWhatsApp}
        contactAddress={branding.contactAddress}
        footerBlurb={branding.footerBlurb}
        footerNotice={branding.footerNotice}
        currencyName={branding.currencyName}
        currencyCode={branding.currencyCode}
        currencySymbol={branding.currencySymbol}
        currencyDisplayMode={branding.currencyDisplayMode}
        currencySymbolPosition={branding.currencySymbolPosition}
        currencyDecimalPlaces={branding.currencyDecimalPlaces}
        currencyUseThousandsSeparator={branding.currencyUseThousandsSeparator}
        currencyDecimalSeparator={branding.currencyDecimalSeparator}
        currencyThousandsSeparator={branding.currencyThousandsSeparator}
        currencySuffix={branding.currencySuffix}
      />
    </main>
  );
}
