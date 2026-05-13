import AnalyticsDashboardPanel from "@/components/analytics/AnalyticsDashboardPanel";
import Link from "next/link";
import { LIVE_VERSION } from "@/lib/version";

export default function PlatformAnalyticsPage() {
  return (
    <main className="min-h-screen bg-[#FFF7F0] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[34px] border border-[#0E0E10]/10 bg-white/90 p-5 shadow-[0_28px_80px_rgba(14,14,16,0.12)] backdrop-blur sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <img src="/orduva-platform-icon-192.png" alt="Orduva" className="h-14 w-14 rounded-[20px] shadow-[0_16px_36px_rgba(14,14,16,0.16)]" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6A3D]">Orduva platform</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0E0E10] sm:text-4xl">Platform analytics</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/platform" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] transition hover:bg-[#F5F2EE]">Owner dashboard</Link>
              <Link href="/platform/referrals" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#FF6A3D]/25 bg-[#FFF7F0] px-5 py-3 text-sm font-black text-[#9A3412] transition hover:bg-white">Referrals</Link>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#5C5F66] sm:text-base">
            Owner-wide analytics across public landing pages, tenant storefront subdomains, tenant admin, owner platform and affiliate pages.
          </p>
          <div className="mt-4 inline-flex rounded-full border border-[#0E0E10]/10 bg-[#FFF7F0] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#5C5F66]">{LIVE_VERSION}</div>
        </header>
        <div className="mt-6">
          <AnalyticsDashboardPanel mode="owner" />
        </div>
      </div>
    </main>
  );
}
