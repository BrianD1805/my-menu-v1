import TenantOnboardingManager from "@/components/admin/TenantOnboardingManager";
import MenuBrowser from "@/components/menu/MenuBrowser";
import StorefrontPwaRegistrar from "@/components/menu/StorefrontPwaRegistrar";
import { db } from "@/lib/db";
import { startLoadTimer } from "@/lib/load-diagnostics";
import { getTenantBySlug, isRootPlatformRequest, resolveTenantSlug } from "@/lib/tenant-server";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { LIVE_VERSION } from "@/lib/version";

function OrduvaPlatformLanding() {
  const palette = [
    { name: "Obsidian", value: "#0E0E10", note: "primary brand depth" },
    { name: "Orduva Orange", value: "#FF6A3D", note: "main accent and calls to action" },
    { name: "Warm Apricot", value: "#FFB168", note: "soft highlights" },
    { name: "Cream", value: "#FFF7F0", note: "warm page background" },
    { name: "Soft Stone", value: "#F5F2EE", note: "card tint" },
    { name: "Charcoal Text", value: "#1F2328", note: "readable text" },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFF7F0] text-[#1F2328]">
      <section className="relative isolate overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_10%,rgba(255,106,61,0.24),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(14,14,16,0.10),transparent_30%),linear-gradient(135deg,#FFF7F0_0%,#F5F2EE_50%,#FFFFFF_100%)]" />
        <div className="absolute -right-28 top-24 -z-10 h-72 w-72 rounded-full bg-[#FF6A3D]/20 blur-3xl" />
        <div className="absolute -left-28 bottom-8 -z-10 h-72 w-72 rounded-full bg-[#0E0E10]/10 blur-3xl" />

        <div className="mx-auto min-h-[calc(100vh-2.5rem)] max-w-7xl overflow-hidden rounded-[38px] border border-white/100 bg-white/[0.82] shadow-[0_34px_100px_rgba(14,14,16,0.14)] backdrop-blur-xl">
          <header className="flex flex-col gap-4 border-b border-[#0E0E10]/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-9">
            <div className="flex items-center gap-3.5">
              <img
                src="/orduva-platform-icon-192.png"
                alt="Orduva"
                className="h-[3.25rem] w-[3.25rem] rounded-[18px] shadow-[0_16px_36px_rgba(14,14,16,0.18)]"
              />
              <div>
                <p className="text-xl font-black tracking-tight text-[#0E0E10]">Orduva</p>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#FF6A3D]">Online ordering platform</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <a
                href="https://admin.orduva.com"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] shadow-sm transition hover:-translate-y-[1px] hover:border-[#0E0E10]/20 hover:bg-[#F5F2EE]"
              >
                Admin login
              </a>
              <a
                href="/#client-onboarding"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:-translate-y-[1px] hover:bg-[#E95C34]"
              >
                Start your store
              </a>
              <a
                href="https://zimzaexpress.orduva.com"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-bold text-white shadow-[0_16px_34px_rgba(14,14,16,0.20)] transition hover:-translate-y-[1px] hover:bg-[#252528]"
              >
                View demo storefront
              </a>
            </div>
          </header>

          <div className="grid gap-10 px-5 py-10 sm:px-7 lg:grid-cols-[1.03fr_0.97fr] lg:px-9 lg:py-14 xl:py-16">
            <div className="flex flex-col justify-center">
              <p className="inline-flex w-fit rounded-full border border-[#FF6A3D]/25 bg-[#FF6A3D]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#C84F2A]">
                Platform home
              </p>
              <h1 className="mt-5 max-w-4xl text-[2.85rem] font-black leading-[0.94] tracking-tight text-[#0E0E10] sm:text-[4.2rem] lg:text-[5.35rem]">
                Online ordering, beautifully organised.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#5C5F66] sm:text-lg">
                Orduva gives each restaurant, café, takeaway, or local business a polished customer storefront, shared admin dashboard, customer accounts, and reliable order notifications.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/#client-onboarding"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FF6A3D] px-6 py-3 text-sm font-black text-white shadow-[0_18px_38px_rgba(255,106,61,0.28)] transition hover:-translate-y-[1px] hover:bg-[#E95C34]"
                >
                  Create your Orduva store
                </a>
                <a
                  href="https://zimzaexpress.orduva.com"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-6 py-3 text-sm font-black text-[#0E0E10] shadow-sm transition hover:-translate-y-[1px] hover:bg-[#F5F2EE]"
                >
                  See the live example
                </a>
              </div>

              <div className="mt-6 rounded-[30px] border border-[#FF6A3D]/20 bg-white/80 p-5 shadow-[0_18px_48px_rgba(14,14,16,0.07)]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C84F2A]">Client store onboarding</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0E0E10]">Ready to launch your own ordering store?</h2>
                <p className="mt-3 text-sm leading-6 text-[#68707A]">
                  Start your Orduva setup directly from this page. No access code is needed — complete the form and Orduva will create your store foundation automatically.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/#client-onboarding"
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(14,14,16,0.18)] transition hover:-translate-y-[1px] hover:bg-[#252528]"
                  >
                    Start setup on this page
                  </a>
                  <a
                    href="https://admin.orduva.com/admin"
                    className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:-translate-y-[1px] hover:bg-[#F5F2EE]"
                  >
                    Already have a store? Go to admin
                  </a>
                </div>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[26px] border border-[#0E0E10]/10 bg-white p-4 shadow-[0_18px_48px_rgba(14,14,16,0.06)]">
                  <p className="text-2xl font-black text-[#FF6A3D]">01</p>
                  <p className="mt-2 text-sm font-black text-[#0E0E10]">Client storefronts</p>
                  <p className="mt-1 text-xs leading-5 text-[#68707A]">Each client gets a branded ordering site on their own subdomain.</p>
                </div>
                <div className="rounded-[26px] border border-[#0E0E10]/10 bg-white p-4 shadow-[0_18px_48px_rgba(14,14,16,0.06)]">
                  <p className="text-2xl font-black text-[#0E0E10]">02</p>
                  <p className="mt-2 text-sm font-black text-[#0E0E10]">Shared admin</p>
                  <p className="mt-1 text-xs leading-5 text-[#68707A]">Manage menus, orders, branding, customers, and alerts.</p>
                </div>
                <div className="rounded-[26px] border border-[#0E0E10]/10 bg-white p-4 shadow-[0_18px_48px_rgba(14,14,16,0.06)]">
                  <p className="text-2xl font-black text-[#FFB168]">03</p>
                  <p className="mt-2 text-sm font-black text-[#0E0E10]">PWA-ready</p>
                  <p className="mt-1 text-xs leading-5 text-[#68707A]">Installable customer and admin experiences for fast daily use.</p>
                </div>
              </div>
            </div>

            <div className="relative flex items-center">
              <div className="absolute -inset-5 rounded-[44px] bg-[radial-gradient(circle_at_30%_20%,rgba(255,106,61,0.28),transparent_35%),radial-gradient(circle_at_80%_85%,rgba(14,14,16,0.18),transparent_34%)] blur-2xl" />
              <div className="relative w-full overflow-hidden rounded-[36px] border border-[#0E0E10]/10 bg-[#0E0E10] p-4 text-white shadow-[0_36px_95px_rgba(14,14,16,0.28)] sm:p-5">
                <div className="rounded-[30px] bg-white p-4 text-[#1F2328] shadow-inner">
                  <div className="rounded-[26px] border border-[#0E0E10]/10 bg-[#FFF7F0] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E0E10] text-lg font-black text-[#FF6A3D]">O</div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C84F2A]">Live setup</p>
                          <p className="mt-1 text-xl font-black text-[#0E0E10]">ZimZa Express</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">Online</span>
                    </div>

                    <div className="mt-5 space-y-3">
                      <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#0E0E10]/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-[#0E0E10]">Fast product browsing</p>
                            <p className="mt-1 text-xs leading-5 text-[#68707A]">Premium cards, quick add, and visual cart feedback.</p>
                          </div>
                          <span className="rounded-full bg-[#FF6A3D]/10 px-2.5 py-1 text-[11px] font-black text-[#C84F2A]">Storefront</span>
                        </div>
                      </div>
                      <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#0E0E10]/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-[#0E0E10]">Order notifications</p>
                            <p className="mt-1 text-xs leading-5 text-[#68707A]">Admin new-order alerts and customer status updates.</p>
                          </div>
                          <span className="rounded-full bg-[#0E0E10]/10 px-2.5 py-1 text-[11px] font-black text-[#0E0E10]">Push</span>
                        </div>
                      </div>
                      <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-[#0E0E10]/10">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-[#0E0E10]">Customer accounts</p>
                            <p className="mt-1 text-xs leading-5 text-[#68707A]">Saved details, order history, and checkout prefill.</p>
                          </div>
                          <span className="rounded-full bg-[#FFB168]/25 px-2.5 py-1 text-[11px] font-black text-[#8A4A16]">Accounts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-white/70">
                  <span>zimzaexpress.orduva.com</span>
                  <span>{LIVE_VERSION}</span>
                </div>
              </div>
            </div>
          </div>

          <section className="border-t border-[#0E0E10]/10 bg-white px-5 py-8 sm:px-7 lg:px-9">
            <div className="grid gap-5 rounded-[32px] border border-[#0E0E10]/10 bg-[#0E0E10] p-5 text-white shadow-[0_24px_70px_rgba(14,14,16,0.18)] sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FFB168]">New client setup</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Create a store, then launch it properly.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                  New clients can create their store foundation directly from this public landing page. The owner platform remains separate and is not part of the client journey.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <a href="/#client-onboarding" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FF6A3D] px-6 py-3 text-sm font-black text-white shadow-[0_18px_38px_rgba(255,106,61,0.24)] transition hover:-translate-y-[1px] hover:bg-[#E95C34]">
                  Start your store
                </a>
                <a href="https://admin.orduva.com/admin" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-[1px] hover:bg-white/20">
                  Store admin login
                </a>
              </div>
            </div>
          </section>

          <section id="client-onboarding" className="scroll-mt-28 border-t border-[#0E0E10]/10 bg-[#FFF7F0] px-5 py-8 sm:px-7 lg:px-9">
            <div className="mb-6 max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#C84F2A]">Client onboarding</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0E0E10]">Start your Orduva store setup here.</h2>
              <p className="mt-3 text-sm leading-7 text-[#68707A]">
                This is the public client onboarding entry point. Complete the setup form below and Orduva will automatically create your store address, starter setup, and owner login.
              </p>
            </div>
            <TenantOnboardingManager initialTenants={[]} apiPath="/api/public/tenants" clientMode />
          </section>

          <section className="border-t border-[#0E0E10]/10 bg-[#F5F2EE]/70 px-5 py-7 sm:px-7 lg:px-9">
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#C84F2A]">Orduva palette</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0E0E10] sm:text-3xl">Built from the Orduva favicon.</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#68707A]">A cleaner root brand palette using the favicon’s dark base, orange accent, and warm supporting neutrals.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {palette.map((colour) => (
                  <div key={colour.value} className="rounded-[22px] border border-[#0E0E10]/10 bg-white p-3 shadow-sm">
                    <div className="h-11 rounded-[16px] ring-1 ring-black/5" style={{ backgroundColor: colour.value }} />
                    <p className="mt-3 text-xs font-black text-[#0E0E10]">{colour.name}</p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#68707A]">{colour.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer className="flex flex-col gap-3 border-t border-[#0E0E10]/10 px-5 py-5 text-sm text-[#68707A] sm:flex-row sm:items-center sm:justify-between sm:px-7 lg:px-9">
            <p>Orduva platform landing page. Tenant storefronts live on their own subdomains.</p>
            <p className="font-black text-[#0E0E10]">{LIVE_VERSION}</p>
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
