import MenuBrowser from "@/components/menu/MenuBrowser";
import StorefrontPwaRegistrar from "@/components/menu/StorefrontPwaRegistrar";
import { db } from "@/lib/db";
import { startLoadTimer } from "@/lib/load-diagnostics";
import { getTenantBySlug, isRootPlatformRequest, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { LIVE_VERSION } from "@/lib/version";

function OrduvaPlatformLanding() {
  const onboardingHref = "/start-your-store";

  const sellingPoints = [
    {
      eyebrow: "Branding",
      title: "Create a colour palette from the logo",
      body: "Upload a logo, generate a matching palette, then save it as the store's own theme. It makes a new client store feel polished without hours of design work.",
    },
    {
      eyebrow: "Live orders",
      title: "Push notifications for new orders",
      body: "Store admins can receive new-order alerts, while customers can be kept updated as order statuses change.",
    },
    {
      eyebrow: "Guided setup",
      title: "A calm launch checklist",
      body: "New store owners are guided through categories, products, branding, test orders and launch steps without being overwhelmed.",
    },
    {
      eyebrow: "Pricing",
      title: "From only $5 a month",
      body: "$5 a month for a 20 product store, or $9.99 a month for up to 100 products. Simple, affordable, and easy to explain.",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFF7F0] text-[#1F2328]">
      <section className="relative isolate overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(255,106,61,0.24),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(14,14,16,0.10),transparent_30%),linear-gradient(135deg,#FFF7F0_0%,#F5F2EE_50%,#FFFFFF_100%)]" />
        <div className="absolute -right-28 top-24 -z-10 h-72 w-72 rounded-full bg-[#FF6A3D]/20 blur-3xl" />
        <div className="absolute -left-28 bottom-8 -z-10 h-72 w-72 rounded-full bg-[#0E0E10]/10 blur-3xl" />

        <div className="mx-auto max-w-7xl overflow-hidden rounded-[38px] border border-white/100 bg-white/[0.84] shadow-[0_34px_100px_rgba(14,14,16,0.14)] backdrop-blur-xl">
          <header className="border-b border-[#0E0E10]/10 px-5 py-5 sm:px-7 lg:px-9">
            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
              <div className="text-center lg:text-left">
                <p className="text-xl font-black tracking-tight text-[#0E0E10]">Orduva</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-[#FF6A3D]">Online ordering platform</p>
              </div>
              <div className="flex justify-center">
                <img
                  src="/orduva-logo-ubuntu-white.png"
                  alt="Orduva — Don't order it, ORDUVA it!"
                  className="h-auto w-full max-w-[420px] object-contain sm:max-w-[520px]"
                />
              </div>
              <div className="flex justify-center lg:justify-end">
                <a href={onboardingHref} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FF6A3D] px-6 py-3 text-sm font-black text-white shadow-[0_18px_38px_rgba(255,106,61,0.24)] transition hover:-translate-y-[1px] hover:bg-[#E95C34]">
                  Start your own store
                </a>
              </div>
            </div>
          </header>

          <section className="px-5 py-8 text-center sm:px-7 lg:px-9 lg:py-11">
            <div className="mx-auto max-w-5xl">
              <p className="mx-auto inline-flex w-fit rounded-full border border-[#FF6A3D]/25 bg-[#FF6A3D]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#C84F2A]">
                Platform home
              </p>
              <h1 className="mt-7 text-[2.35rem] font-black leading-[0.98] tracking-tight text-[#0E0E10] sm:text-[3.5rem] lg:text-[4.55rem]">
                Give any local business a beautiful ordering store.
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#5C5F66] sm:text-lg">
                Orduva creates branded storefronts, guided admin setup, customer accounts, order notifications and practical launch tools for restaurants, cafés, takeaways and local sellers.
              </p>
            </div>
          </section>

          <section className="border-t border-[#0E0E10]/10 bg-[#F5F2EE]/70 px-5 py-8 sm:px-7 lg:px-9 lg:py-10">
            <div className="mx-auto max-w-5xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#C84F2A]">Top selling points</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0E0E10] sm:text-4xl">Simple to sell. Easy to launch.</h2>
            </div>
            <div className="mt-7 grid gap-4 lg:grid-cols-4">
              {sellingPoints.map((point) => (
                <article key={point.title} className="rounded-[28px] border border-[#0E0E10]/10 bg-white p-5 shadow-[0_18px_50px_rgba(14,14,16,0.07)]">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#C84F2A]">{point.eyebrow}</p>
                  <h3 className="mt-3 text-xl font-black tracking-tight text-[#0E0E10]">{point.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#68707A]">{point.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="border-t border-[#0E0E10]/10 bg-white px-5 py-8 sm:px-7 lg:px-9">
            <div className="grid gap-5 rounded-[32px] border border-[#0E0E10]/10 bg-[#0E0E10] p-5 text-white shadow-[0_24px_70px_rgba(14,14,16,0.18)] sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FFB168]">New client setup</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Create a store, then launch it properly.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                  New clients can create their own store foundation from a dedicated Orduva onboarding page. ZimZa Express remains the live working example and demo storefront.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <a href={onboardingHref} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FF6A3D] px-6 py-3 text-sm font-black text-white shadow-[0_18px_38px_rgba(255,106,61,0.24)] transition hover:-translate-y-[1px] hover:bg-[#E95C34]">
                  Start your own store
                </a>
                <a href="https://admin.orduva.com/admin" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-[1px] hover:bg-white/20">
                  Store admin login
                </a>
              </div>
            </div>
          </section>

          <footer className="border-t border-[#0E0E10]/10 px-5 py-6 text-center text-sm text-[#68707A] sm:px-7 lg:px-9">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <a href={onboardingHref} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.20)] transition hover:-translate-y-[1px] hover:bg-[#E95C34]">
                Start your own store
              </a>
              <a href="https://zimzaexpress.orduva.com" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-black text-[#0E0E10] shadow-sm transition hover:-translate-y-[1px] hover:bg-[#F5F2EE]">
                View ZimZa Express demo
              </a>
              <a href="https://admin.orduva.com/admin" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(14,14,16,0.18)] transition hover:-translate-y-[1px] hover:bg-[#252528]">
                Admin login
              </a>
            </div>
            <p className="mx-auto mt-5 max-w-3xl leading-6">Orduva platform landing page. ZimZa Express is the working demo storefront; client stores live on their own subdomains.</p>
            <p className="mt-2 font-black text-[#0E0E10]">{LIVE_VERSION}</p>
          </footer>
        </div>
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
      <main className="mx-auto min-h-screen max-w-7xl overflow-x-clip px-4 pb-10 pt-0 sm:px-5 lg:px-6" style={{ backgroundColor: branding.storefrontTheme?.globalPageBackground || branding.backgroundTint }}>
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
          socialFacebookUrl={branding.socialFacebookUrl}
          socialInstagramUrl={branding.socialInstagramUrl}
          socialTikTokUrl={branding.socialTikTokUrl}
          socialXUrl={branding.socialXUrl}
          socialWebsiteUrl={branding.socialWebsiteUrl}
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
          storefrontTheme={branding.storefrontTheme}
        />
      </main>
    </>
  );
}
