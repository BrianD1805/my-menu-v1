export const dynamic = "force-dynamic";
export const revalidate = 0;

import OwnerStripePriceConfigPanel from "@/components/admin/OwnerStripePriceConfigPanel";
import { LIVE_VERSION } from "@/lib/version";

export default function PlatformBillingPage() {
  return (
    <main className="min-h-screen bg-[#F3F7FA] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[34px] border border-[#0E0E10]/10 bg-gradient-to-br from-[#0E0E10] via-[#102338] to-[#336699] p-5 text-white shadow-[0_28px_80px_rgba(14,14,16,0.16)] sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#BFD8EE]">Stripe billing</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-4xl">Stripe price ID configuration</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 sm:text-base">
            Use this page to check which Stripe Price IDs are configured for Starter, Growth and Pro across monthly/yearly billing and the five launch currencies.
          </p>
          <div className="mt-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#BFD8EE]">{LIVE_VERSION}</div>
        </header>
        <div className="mt-6"><OwnerStripePriceConfigPanel /></div>
      </div>
    </main>
  );
}
