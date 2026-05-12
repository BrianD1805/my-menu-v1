import OwnerBillingOverviewPanel from "@/components/admin/OwnerBillingOverviewPanel";
import OwnerStoreReadinessPanel from "@/components/admin/OwnerStoreReadinessPanel";
import Link from "next/link";
import { LIVE_VERSION } from "@/lib/version";

export default function PlatformDashboardPage() {
  return (
      <main className="min-h-screen bg-[#FFF7F0] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="rounded-[34px] border border-[#0E0E10]/10 bg-white/90 p-5 shadow-[0_28px_80px_rgba(14,14,16,0.12)] backdrop-blur sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/orduva-platform-icon-192.png"
                  alt="Orduva"
                  className="h-14 w-14 rounded-[20px] shadow-[0_16px_36px_rgba(14,14,16,0.16)]"
                />
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6A3D]">
                    Orduva platform
                  </p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0E0E10] sm:text-4xl">
                    Owner dashboard
                  </h1>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  href="/platform/onboarding"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:bg-[#e65f36]"
                >
                  Onboarding tools
                </Link>
                <Link
                  href="/platform/referrals"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#FF6A3D]/25 bg-[#FFF7F0] px-5 py-3 text-sm font-black text-[#9A3412] transition hover:bg-white"
                >
                  Referrals
                </Link>
                <Link
                  href="/platform/affiliates"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 transition hover:bg-white"
                >
                  Affiliates
                </Link>
                <Link
                  href="/platform/billing"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#FF6A3D]/25 bg-[#FFF7F0] px-5 py-3 text-sm font-black text-[#9A3412] transition hover:bg-white"
                >
                  Billing
                </Link>
                <Link
                  href="/platform/security"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] transition hover:bg-[#F5F2EE]"
                >
                  Security
                </Link>
                <a
                  href="https://admin.orduva.com/admin"
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#252528]"
                >
                  Store admin login
                </a>
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#5C5F66] sm:text-base">
              The main owner view for Orduva. Use the cards below to jump straight to stores, paying clients, trials, expired trials, checkout paused stores, and stores that still need setup.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="inline-flex rounded-full border border-[#0E0E10]/10 bg-[#FFF7F0] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#5C5F66]">
                {LIVE_VERSION}
              </div>
              <div className="inline-flex rounded-full border border-[#FF6A3D]/20 bg-[#FF6A3D]/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#C84F2A]">
                Owner dashboard
              </div>
            </div>
          </header>

          <div className="mt-6">
            <OwnerBillingOverviewPanel />
          </div>

          <div className="mt-6">
            <OwnerStoreReadinessPanel />
          </div>
        </div>
      </main>
  );
}
