export const dynamic = "force-dynamic";
export const revalidate = 0;

import AnalyticsDashboardPanel from "@/components/analytics/AnalyticsDashboardPanel";
import { LIVE_VERSION } from "@/lib/version";

export default function PlatformAnalyticsPage() {
  return (
    <main className="min-h-screen bg-[#F3F7FA] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[34px] border border-[#0E0E10]/10 bg-gradient-to-br from-[#0E0E10] via-[#102338] to-[#336699] p-5 text-white shadow-[0_28px_80px_rgba(14,14,16,0.16)] sm:p-7">
          <div className="flex items-center gap-4">
            <img src="/orduva-owner-platform-icon-192.png" alt="Orduva" className="h-14 w-14 rounded-full object-cover shadow-[0_16px_36px_rgba(0,0,0,0.24)]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#BFD8EE]">Orduva platform</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-4xl">Platform analytics</h1>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            Owner-wide analytics across public landing pages, tenant storefront subdomains, tenant admin, owner platform and affiliate pages.
          </p>
          <div className="mt-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#BFD8EE]">{LIVE_VERSION}</div>
        </header>
        <div className="mt-6"><AnalyticsDashboardPanel mode="owner" /></div>
      </div>
    </main>
  );
}
