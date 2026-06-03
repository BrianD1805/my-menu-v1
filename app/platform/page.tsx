import OwnerBillingOverviewPanel from "@/components/admin/OwnerBillingOverviewPanel";
import { LIVE_VERSION } from "@/lib/version";

export default function PlatformDashboardPage() {
  return (
      <main className="min-h-screen bg-[#F3F7FA] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="rounded-[34px] border border-[#0E0E10]/10 bg-white/90 p-5 shadow-[0_28px_80px_rgba(14,14,16,0.12)] backdrop-blur sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/orduva-owner-platform-icon-192.png"
                  alt="Orduva"
                  className="h-14 w-14 rounded-full object-cover shadow-[0_16px_36px_rgba(14,14,16,0.16)]"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#336699]">
                    Orduva platform
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0E0E10] sm:text-4xl">
                    Owner dashboard
                  </h1>
                </div>
              </div>
              <div className="rounded-[26px] border border-[#0E0E10]/10 bg-[#F3F7FA] px-5 py-4 text-sm font-bold leading-6 text-[#5C5F66] lg:max-w-md">
                Use the three owner menu groups in the black header. The dashboard stays focused on client status only.
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#5C5F66] sm:text-base">
              The main owner view for Orduva. Start with paid clients, free trials and expired trials, then open a single row only when you need more detail.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="inline-flex rounded-full border border-[#0E0E10]/10 bg-[#F3F7FA] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5C5F66]">
                {LIVE_VERSION}
              </div>
              <div className="inline-flex rounded-full border border-[#336699]/20 bg-[#336699]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#336699]">
                Owner dashboard
              </div>
            </div>
          </header>

          <div className="mt-6">
            <OwnerBillingOverviewPanel />
          </div>

        </div>
      </main>
  );
}
