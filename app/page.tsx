import MenuBrowser from "@/components/menu/MenuBrowser";
import StorefrontPwaRegistrar from "@/components/menu/StorefrontPwaRegistrar";
import { db } from "@/lib/db";
import { startLoadTimer } from "@/lib/load-diagnostics";
import { getTenantBySlug, isRootPlatformRequest, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { LIVE_VERSION } from "@/lib/version";

function OrduvaPlatformLanding() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(51,102,153,0.18),transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef4f8_42%,#fff7ed_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl flex-col justify-between rounded-[34px] border border-white/80 bg-white/82 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur sm:p-7 lg:p-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#336699] text-lg font-black text-white shadow-[0_14px_34px_rgba(51,102,153,0.28)]">
              O
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-950">Orduva</p>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Online Ordering SaaS</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="https://admin.orduva.com"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50"
            >
              Admin login
            </a>
            <a
              href="https://zimzaexpress.orduva.com"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#336699] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(51,102,153,0.24)] transition hover:-translate-y-[1px] hover:bg-[#28547f]"
            >
              View demo storefront
            </a>
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div>
            <p className="inline-flex rounded-full border border-[#336699]/15 bg-[#336699]/8 px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#336699]">
              Platform home
            </p>
            <h1 className="mt-5 max-w-4xl text-[2.65rem] font-black leading-[0.95] tracking-tight text-slate-950 sm:text-[4.1rem] lg:text-[5rem]">
              Ordering pages for every food business.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Orduva gives each restaurant, café, takeaway, or local business its own fast storefront, shared admin dashboard, customer accounts, and order notifications.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-[#336699]">01</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">Tenant storefronts</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Each client gets their own subdomain storefront.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-[#d98a24]">02</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">Shared admin</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Manage products, orders, branding, and alerts.</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-2xl font-black text-emerald-600">03</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">Customer-ready</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Account history, saved details, and push updates.</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[42px] bg-[radial-gradient(circle_at_30%_20%,rgba(51,102,153,0.24),transparent_36%),radial-gradient(circle_at_80%_80%,rgba(217,138,36,0.22),transparent_34%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[34px] border border-white bg-slate-950 p-5 text-white shadow-[0_34px_90px_rgba(15,23,42,0.26)]">
              <div className="rounded-[28px] bg-white p-4 text-slate-900">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Example storefront</p>
                      <p className="mt-1 text-xl font-black text-slate-950">ZimZa Express</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">Live</span>
                  </div>
                  <div className="mt-5 grid gap-3">
                    <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
                      <p className="text-sm font-bold text-slate-950">Premium product cards</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Fast add-to-cart, clean buttons, and tenant colours.</p>
                    </div>
                    <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
                      <p className="text-sm font-bold text-slate-950">Order notifications</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Admin new-order alerts and customer status updates.</p>
                    </div>
                    <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
                      <p className="text-sm font-bold text-slate-950">Customer accounts</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Saved details, order history, and checkout prefill.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-white/70">
                <span>zimzaexpress.orduva.com</span>
                <span>{LIVE_VERSION}</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Orduva platform landing page. Tenant storefronts now live on their own subdomains.</p>
          <p className="font-semibold text-slate-600">{LIVE_VERSION}</p>
        </footer>
      </section>
    </main>
  );
}

export default async function HomePage() {
  const isPlatformRoot = await isRootPlatformRequest();

  if (isPlatformRoot) {
    return <OrduvaPlatformLanding />;
  }

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
