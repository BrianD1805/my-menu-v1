import TenantOnboardingManager from "@/components/admin/TenantOnboardingManager";
import PricingPlans from "@/components/marketing/PricingPlans";
import { LIVE_VERSION } from "@/lib/version";

export default function StartYourStorePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F2EA] text-[#1F2328]">
      <section className="relative isolate overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_8%,rgba(255,111,28,0.20),transparent_30%),radial-gradient(circle_at_82%_16%,rgba(81,55,45,0.14),transparent_30%),radial-gradient(circle_at_55%_88%,rgba(255,181,112,0.20),transparent_34%),linear-gradient(135deg,#FFF8EF_0%,#EEE4D7_48%,#F8FAF7_100%)]" />
        <div className="absolute -right-28 top-24 -z-10 h-72 w-72 rounded-full bg-[#FF7A1A]/18 blur-3xl" />
        <div className="absolute -left-28 bottom-8 -z-10 h-72 w-72 rounded-full bg-[#51372D]/12 blur-3xl" />

        <div className="mx-auto max-w-7xl overflow-hidden rounded-[38px] border border-white/90 bg-[#FFFDF8]/[0.9] shadow-[0_34px_100px_rgba(39,31,27,0.16)] backdrop-blur-xl">
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
                  className="h-auto w-full max-w-[340px] object-contain sm:max-w-[450px] lg:max-w-[500px]"
                />
              </div>
              <div className="flex justify-center lg:justify-end">
                <a href="/" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#51372D]/12 bg-white px-5 py-3 text-sm font-black text-[#14110F] shadow-sm transition hover:-translate-y-[1px] hover:bg-[#EFE6D9]">
                  Back to Orduva home
                </a>
              </div>
            </div>
          </header>

          <section className="px-5 py-8 text-center sm:px-7 lg:px-9 lg:py-10">
            <div className="mx-auto max-w-4xl">
              <p className="mx-auto inline-flex w-fit rounded-full border border-[#F97316]/25 bg-[#FFF1E6] px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-[#B74A16]">
                Start your 7-day trial
              </p>
              <h1 className="mt-6 text-[2.2rem] font-black leading-[1] tracking-tight text-[#14110F] sm:text-[3.3rem] lg:text-[4.1rem]">
                Tell us about your store.
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#5F625F] sm:text-lg">
                Create your Orduva storefront in a few minutes. No payment is taken today — your store starts with a 7-day trial so you can set up your menu, branding and order flow properly.
              </p>
            </div>
          </section>

          <section className="border-t border-[#51372D]/12 bg-white/76 px-5 py-7 sm:px-7 lg:px-9 lg:py-9">
            <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
              <div className="rounded-[26px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-5 shadow-[0_14px_34px_rgba(81,55,45,0.07)]">
                <p className="text-sm font-black text-[#14110F]">No payment today</p>
                <p className="mt-2 text-sm leading-6 text-[#667069]">Start with a 7-day Orduva trial and decide once your store is set up.</p>
              </div>
              <div className="rounded-[26px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-5 shadow-[0_14px_34px_rgba(81,55,45,0.07)]">
                <p className="text-sm font-black text-[#14110F]">Your own store address</p>
                <p className="mt-2 text-sm leading-6 text-[#667069]">Choose your store name and Orduva creates your storefront link automatically.</p>
              </div>
              <div className="rounded-[26px] border border-[#E8D8C8]/90 bg-[#FFF8EF] p-5 shadow-[0_14px_34px_rgba(81,55,45,0.07)]">
                <p className="text-sm font-black text-[#14110F]">Manage everything online</p>
                <p className="mt-2 text-sm leading-6 text-[#667069]">After setup, use your admin area for products, prices, branding and orders.</p>
              </div>
            </div>
          </section>

          <PricingPlans onboardingHref="/start-your-store" compact selectMode formTargetId="store-details" />

          <section id="store-details" className="scroll-mt-6 border-t border-[#51372D]/12 bg-[#EFE6D9]/72 px-5 py-8 sm:px-7 lg:px-9 lg:py-10">
            <div className="mx-auto max-w-4xl">
              <TenantOnboardingManager initialTenants={[]} apiPath="/api/public/tenants" clientMode />
            </div>
          </section>

          <footer className="border-t border-[#51372D]/12 px-5 py-6 text-center text-sm text-[#667069] sm:px-7 lg:px-9">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
              <a href="/" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#51372D]/12 bg-white px-5 py-3 text-sm font-black text-[#14110F] shadow-sm transition hover:-translate-y-[1px] hover:bg-[#EFE6D9]">
                Back to Orduva home
              </a>
              <a href="https://zimzaexpress.orduva.com" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#14110F] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(14,14,16,0.18)] transition hover:-translate-y-[1px] hover:bg-[#2A211D]">
                View a live store demo
              </a>
            </div>
            <p className="mx-auto mt-5 max-w-3xl leading-6">Orduva creates branded online ordering storefronts for restaurants, cafés, takeaways and local sellers.</p>
            <p className="mt-2 font-black text-[#14110F]">{LIVE_VERSION}</p>
          </footer>
        </div>
      </section>
    </main>
  );
}
