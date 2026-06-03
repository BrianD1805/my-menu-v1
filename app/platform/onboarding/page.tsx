export const dynamic = "force-dynamic";
export const revalidate = 0;

import TenantOnboardingManager from "@/components/admin/TenantOnboardingManager";
import OwnerEmailSettingsPanel from "@/components/admin/OwnerEmailSettingsPanel";
import OwnerOnboardingEventsPanel from "@/components/admin/OwnerOnboardingEventsPanel";
import { LIVE_VERSION } from "@/lib/version";

export default function PlatformOnboardingPage() {
  return (
    <main className="min-h-screen bg-[#F3F7FA] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[34px] border border-[#0E0E10]/10 bg-gradient-to-br from-[#0E0E10] via-[#102338] to-[#336699] p-5 text-white shadow-[0_28px_80px_rgba(14,14,16,0.16)] sm:p-7">
          <div className="flex items-center gap-4">
            <img src="/orduva-owner-platform-icon-192.png" alt="Orduva" className="h-14 w-14 rounded-full object-cover shadow-[0_16px_36px_rgba(0,0,0,0.24)]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#BFD8EE]">Orduva platform</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-4xl">Onboarding tools</h1>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            Dedicated owner tools for store creation, onboarding checks, owner email testing and onboarding events. Use the header menu for page navigation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#BFD8EE]">{LIVE_VERSION}</div>
            <div className="inline-flex rounded-full border border-[#339933]/25 bg-[#339933]/14 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#DDFBE4]">Owner onboarding</div>
          </div>
        </header>

        <div className="mt-6 space-y-6">
          <OwnerEmailSettingsPanel apiPath="/api/platform/email-settings/test" platformMode />
          <TenantOnboardingManager initialTenants={[]} apiPath="/api/platform/tenants" platformMode />
          <OwnerOnboardingEventsPanel />
        </div>
      </div>
    </main>
  );
}
