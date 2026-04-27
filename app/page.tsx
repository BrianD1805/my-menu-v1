import MenuBrowser from "@/components/menu/MenuBrowser";
import StorefrontPwaRegistrar from "@/components/menu/StorefrontPwaRegistrar";
import { db } from "@/lib/db";
import { startLoadTimer } from "@/lib/load-diagnostics";
import { getTenantBySlug, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { LIVE_VERSION } from "@/lib/version";

export default async function HomePage() {
  const totalTimer = startLoadTimer("storefront total server render");
  const slugTimer = startLoadTimer("storefront tenant slug resolve");
  const slug = await resolveTenantSlug();
  slugTimer.end({ slug });

  const tenantTimer = startLoadTimer("storefront tenant lookup");
  const tenant = await getTenantBySlug(slug);
  tenantTimer.end({ tenantId: tenant.id, slug: tenant.slug });

  const storefrontDataTimer = startLoadTimer("storefront settings/categories/products parallel load");
  const [settings, categoriesResult, productsResult] = await Promise.all([
    getTenantSettings(tenant.id),
    db
      .from("categories")
      .select("id, name, sort_order")
      .eq("tenant_id", tenant.id)
      .order("sort_order", { ascending: true }),
    db
      .from("products")
      .select("id, category_id, name, description, image_url, price")
      .eq("tenant_id", tenant.id)
      .eq("is_active", true),
  ]);
  storefrontDataTimer.end({
    categories: categoriesResult.data?.length || 0,
    products: productsResult.data?.length || 0,
    categoriesError: Boolean(categoriesResult.error),
    productsError: Boolean(productsResult.error),
  });

  const branding = buildTenantBranding(tenant.slug, tenant.name, settings);
  totalTimer.end({ tenantSlug: slug });

  return (
    <>
      <StorefrontPwaRegistrar />
      <main className="mx-auto min-h-screen max-w-7xl overflow-x-clip px-4 pb-10 pt-0 sm:px-5 lg:px-6">
      <MenuBrowser
        tenantSlug={slug}
        tenantId={tenant.id}
        tenantName={branding.displayName}
        version={LIVE_VERSION}
        categories={categoriesResult.data || []}
        products={productsResult.data || []}
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
    </>
  );
}
