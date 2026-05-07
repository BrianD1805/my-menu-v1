import EarlyStorefrontPreloader from "@/components/menu/EarlyStorefrontPreloader";
import StorefrontClientLoader from "@/components/menu/StorefrontClientLoader";
import StorefrontPwaRegistrar from "@/components/menu/StorefrontPwaRegistrar";
import { isRootPlatformRequest, resolveTenantSlug } from "@/lib/tenant-server";
import { LIVE_VERSION } from "@/lib/version";

function OrduvaPlatformLanding() {
  const onboardingHref = "/start-your-store";

  const sellingPoints = [
    {
      eyebrow: "Branding",
      icon: "🎨",
      title: "Create a colour palette from the logo",
      body: "Upload a logo, generate a matching palette, then save it as the store's own theme. It makes a new client store feel polished without hours of design work.",
    },
    {
      eyebrow: "Live orders",
      icon: "🔔",
      title: "Push notifications for new orders",
      body: "Store admins can receive new-order alerts, while customers can be kept updated as order statuses change.",
    },
    {
      eyebrow: "Guided setup",
      icon: "✅",
      title: "A calm launch checklist",
      body: "New store owners are guided through categories, products, branding, test orders and launch steps without being overwhelmed.",
    },
    {
      eyebrow: "Pricing",
      icon: "💰",
      title: "From only $5 a month",
      body: "$5 a month for a 20 product store, or $9.99 a month for up to 100 products. Simple, affordable, and easy to explain.",
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F2EA] text-[#1F2328]">
      <section className="relative isolate overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_8%,rgba(255,111,28,0.20),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(81,55,45,0.14),transparent_30%),radial-gradient(circle_at_55%_88%,rgba(255,181,112,0.20),transparent_34%),linear-gradient(135deg,#FFF8EF_0%,#EEE4D7_48%,#F8FAF7_100%)]" />
        <div className="absolute -right-28 top-24 -z-10 h-72 w-72 rounded-full bg-[#FF7A1A]/18 blur-3xl" />
        <div className="absolute -left-28 bottom-8 -z-10 h-72 w-72 rounded-full bg-[#51372D]/12 blur-3xl" />

        <div className="mx-auto max-w-7xl overflow-hidden rounded-[38px] border border-white/90 bg-[#FFFDF8]/[0.88] shadow-[0_34px_100px_rgba(39,31,27,0.16)] backdrop-blur-xl">
          <header className="border-b border-[#51372D]/12 px-5 py-5 sm:px-7 lg:px-9">
            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-6">
              <div className="text-center lg:text-left">
                <p className="text-xl font-black tracking-tight text-[#14110F]">Orduva</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.24em] text-[#F97316]">Online ordering platform</p>
              </div>
              <div className="flex justify-center">
                <img
                  src="/orduva-logo-hero-updated.png"
                  alt="Orduva — Don't order it, ORDUVA it!"
                  className="h-auto w-full max-w-[360px] object-contain sm:max-w-[470px] lg:max-w-[520px]"
                />
              </div>
              <div className="hidden lg:block" aria-hidden="true" />
            </div>
          </header>

          <section className="px-5 py-8 text-center sm:px-7 lg:px-9 lg:py-11">
            <div className="mx-auto max-w-5xl">
              <p className="mx-auto inline-flex w-fit rounded-full border border-[#F97316]/25 bg-[#FFF1E6] px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#B74A16]">
                Welcome to Orduva
              </p>
              <h1 className="mt-7 text-[2.35rem] font-black leading-[0.98] tracking-tight text-[#14110F] sm:text-[3.5rem] lg:text-[4.55rem]">
                Give your business a beautiful storefront!
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#5F625F] sm:text-lg">
                Orduva creates branded storefronts, guided admin setup, customer accounts, order notifications and practical launch tools for restaurants, cafés, takeaways and local sellers.
              </p>
            </div>
          </section>

          <section className="relative overflow-hidden border-t border-[#51372D]/12 bg-[#EFE6D9]/72 px-5 py-8 sm:px-7 lg:px-9 lg:py-10">
            <div className="pointer-events-none absolute -left-16 top-10 h-32 w-32 rounded-full bg-[#FF6A3D]/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-16 bottom-4 h-36 w-36 rounded-full bg-[#14110F]/8 blur-3xl" />
            <div className="mx-auto max-w-5xl text-center">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#B74A16]">Top selling points</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#14110F] sm:text-4xl">Simple to sell. Easy to launch.</h2>
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-[#667069] sm:text-base">A cleaner, more premium setup story for new clients — with practical tools that help them get live fast.</p>
            </div>
            <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {sellingPoints.map((point, index) => (
                <article
                  key={point.title}
                  className={`group relative overflow-hidden rounded-[30px] border border-[#E8D8C8]/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(255,247,235,0.98)_60%,rgba(246,239,229,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(14,14,16,0.07)] transition duration-300 hover:-translate-y-[4px] hover:shadow-[0_28px_70px_rgba(81,55,45,0.15)] ${index % 2 === 0 ? 'orduva-float-soft' : 'orduva-breathe'}`}
                >
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="orduva-glow-sweep absolute left-0 top-0 h-full w-20 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.78),transparent)]" />
                  </div>
                  <div className="relative z-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B74A16]">{point.eyebrow}</p>
                      <h3 className="mt-3 text-xl font-black tracking-tight text-[#14110F]">{point.title}</h3>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#F97316]/18 bg-[#FFF1E6] text-2xl shadow-[0_14px_28px_rgba(249,115,22,0.12)]">
                      <span aria-hidden="true">{point.icon}</span>
                    </div>
                  </div>
                  <p className="relative z-10 mt-4 text-sm leading-6 text-[#667069]">{point.body}</p>
                  <div className="relative z-10 mt-5 h-1.5 w-16 rounded-full bg-[linear-gradient(90deg,#F97316_0%,#FFB36B_55%,#D98C40_100%)]" />
                </article>
              ))}
            </div>
          </section>

          <section className="border-t border-[#51372D]/12 bg-white px-5 py-8 sm:px-7 lg:px-9">
            <div className="grid gap-5 rounded-[32px] border border-[#51372D]/12 bg-[#14110F] p-5 text-white shadow-[0_24px_70px_rgba(14,14,16,0.18)] sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FFB36B]">New client setup</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Create a store, then launch it properly.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                  New clients can create their own store foundation from a dedicated Orduva onboarding page. ZimZa Express remains the live working example and demo storefront.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <a href={onboardingHref} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#F97316] px-6 py-3 text-sm font-black text-white shadow-[0_18px_38px_rgba(249,115,22,0.24)] transition hover:-translate-y-[1px] hover:bg-[#EA580C]">
                  Start your own store
                </a>
                <a href="https://admin.orduva.com/admin" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:-translate-y-[1px] hover:bg-white/20">
                  Store admin login
                </a>
              </div>
            </div>
          </section>

          <footer className="border-t border-[#51372D]/12 px-5 py-6 text-center text-sm text-[#667069] sm:px-7 lg:px-9">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <a href="https://zimzaexpress.orduva.com" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#51372D]/12 bg-white px-5 py-3 text-sm font-black text-[#14110F] shadow-sm transition hover:-translate-y-[1px] hover:bg-[#EFE6D9]">
                View a live store demo
              </a>
              <a href="https://admin.orduva.com/admin" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#14110F] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(14,14,16,0.18)] transition hover:-translate-y-[1px] hover:bg-[#2A211D]">
                Admin login
              </a>
            </div>
            <p className="mx-auto mt-5 max-w-3xl leading-6">Orduva platform landing page. ZimZa Express is the working demo storefront; client stores live on their own subdomains.</p>
            <p className="mt-2 font-black text-[#14110F]">{LIVE_VERSION}</p>
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

  const slug = await resolveTenantSlug();

  return (
    <>
      <EarlyStorefrontPreloader />
      <StorefrontPwaRegistrar />
      <StorefrontClientLoader tenantSlug={slug} version={LIVE_VERSION} />
    </>
  );
}
