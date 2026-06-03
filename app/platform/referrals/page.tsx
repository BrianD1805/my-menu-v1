export const dynamic = "force-dynamic";
export const revalidate = 0;

import OwnerReferralRewardsPanel from "@/components/admin/OwnerReferralRewardsPanel";
import Link from "next/link";
import { LIVE_VERSION } from "@/lib/version";

export default function PlatformReferralsPage() {
  return (
    <main className="min-h-screen bg-[#F3F7FA] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[34px] border border-[#0E0E10]/10 bg-white/90 p-5 shadow-[0_28px_80px_rgba(14,14,16,0.12)] backdrop-blur sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <img src="/orduva-owner-platform-icon-192.png" alt="Orduva" className="h-14 w-14 rounded-full object-cover shadow-[0_16px_36px_rgba(14,14,16,0.16)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#336699]">Orduva platform</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0E0E10] sm:text-4xl">Referrals</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/platform" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] transition hover:bg-[#EAF3FB]">Dashboard</Link>
              <Link href="/platform/onboarding" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] transition hover:bg-[#EAF3FB]">Onboarding</Link>
              <Link href="/platform/security" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#252528]">Security</Link>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#5C5F66] sm:text-base">
            Manage tenant referral rewards. The percentage is changeable per referral, and each recorded monthly subscription payment automatically creates the tenant credit.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex rounded-full border border-[#0E0E10]/10 bg-[#F3F7FA] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5C5F66]">{LIVE_VERSION}</div>
            <div className="inline-flex rounded-full border border-[#336699]/20 bg-[#336699]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#28547D]">Payment event ledger</div>
          </div>
        </header>
        <div className="mt-6"><OwnerReferralRewardsPanel /></div>
      </div>
    </main>
  );
}
