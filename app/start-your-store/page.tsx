import TenantOnboardingManager from "@/components/admin/TenantOnboardingManager";
import { LIVE_VERSION } from "@/lib/version";

export default function StartYourStorePage() {
  return (
    <main className="min-h-screen bg-[#FFF7F0] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="overflow-hidden rounded-[34px] border border-[#0E0E10]/10 bg-white/90 shadow-[0_28px_80px_rgba(14,14,16,0.12)] backdrop-blur">
          <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4">
              <img src="/orduva-platform-icon-192.png" alt="Orduva" className="h-14 w-14 rounded-[20px] shadow-[0_16px_36px_rgba(14,14,16,0.16)]" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6A3D]">Start your own store</p>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-[#0E0E10] sm:text-5xl">Create your Orduva store.</h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-[#5C5F66] sm:text-base">
                  Complete the setup form below and Orduva will automatically create your store address and owner login. After setup, Orduva prepares your launch links and sends them by email when email delivery is connected. No payment is taken at this stage; your store starts with a 7-day Orduva trial.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <a href="/" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-[#F5F2EE]">Back to Orduva home</a>
              <a href="https://zimzaexpress.orduva.com" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white transition hover:bg-[#252528]">View ZimZa Express demo</a>
            </div>
          </div>
          <div className="border-t border-[#0E0E10]/10 bg-[#0E0E10] px-5 py-4 text-white sm:px-7">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-sm font-black">1. Create the store</p>
                <p className="mt-1 text-xs leading-5 text-white/65">Choose your business name and store address.</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-sm font-black">2. Sign in to admin</p>
                <p className="mt-1 text-xs leading-5 text-white/65">Use the owner login you create below.</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-sm font-black">3. Launch properly</p>
                <p className="mt-1 text-xs leading-5 text-white/65">Use your launch email, add products, check branding and place a test order.</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[34px] border border-[#0E0E10]/10 bg-white/92 p-5 shadow-[0_22px_70px_rgba(14,14,16,0.10)] sm:p-7">
          <div className="mb-6 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#C84F2A]">Automated client onboarding</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0E0E10]">Set up your store foundation here.</h2>
            <p className="mt-3 text-sm leading-7 text-[#68707A]">
              This page is for new client stores. You do not need an access code to create your store foundation.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[#0E0E10]/10 bg-[#FFF7F0] px-4 py-3 shadow-sm">
                <p className="text-sm font-black text-[#0E0E10]">No payment today</p>
                <p className="mt-1 text-xs leading-5 text-[#68707A]">Your store starts with a 7-day Orduva trial. Payment options are added after setup.</p>
              </div>
              <div className="rounded-[22px] border border-[#0E0E10]/10 bg-[#FFF7F0] px-4 py-3 shadow-sm">
                <p className="text-sm font-black text-[#0E0E10]">Real store setup</p>
                <p className="mt-1 text-xs leading-5 text-[#68707A]">Your store address and admin login are created automatically.</p>
              </div>
              <div className="rounded-[22px] border border-[#0E0E10]/10 bg-[#FFF7F0] px-4 py-3 shadow-sm">
                <p className="text-sm font-black text-[#0E0E10]">Protected form</p>
                <p className="mt-1 text-xs leading-5 text-[#68707A]">Basic spam checks and setup terms help protect the platform.</p>
              </div>
            </div>
          </div>
          <TenantOnboardingManager initialTenants={[]} apiPath="/api/public/tenants" clientMode />
        </section>

        <footer className="flex flex-col gap-3 px-2 py-5 text-sm text-[#68707A] sm:flex-row sm:items-center sm:justify-between">
          <p>Orduva client store onboarding. ZimZa Express is available as the working demo storefront.</p>
          <p className="font-black text-[#0E0E10]">{LIVE_VERSION}</p>
        </footer>
      </div>
    </main>
  );
}
