export const dynamic = "force-dynamic";
export const revalidate = 0;

import OwnerCustomDomainsPanel from "@/components/admin/OwnerCustomDomainsPanel";
import { LIVE_VERSION } from "@/lib/version";

export default function PlatformCustomDomainsPage() {
  return (
    <main className="min-h-screen bg-[#F3F7FA] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[34px] border border-[#0E0E10]/10 bg-white/90 p-5 shadow-[0_28px_80px_rgba(14,14,16,0.12)] backdrop-blur sm:p-7">
          <div className="flex items-center gap-4">
            <img src="/orduva-owner-platform-icon-192.png" alt="Orduva" className="h-14 w-14 rounded-full object-cover shadow-[0_16px_36px_rgba(14,14,16,0.16)]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#336699]">Orduva platform</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#0E0E10] sm:text-4xl">Custom domain add-ons</h1>
            </div>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-[#5C5F66] sm:text-base">
            Review tenant custom-domain requests, track billing status, keep DNS/Netlify notes and approve domains only after the monthly add-on is active.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex rounded-full border border-[#0E0E10]/10 bg-[#F3F7FA] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5C5F66]">{LIVE_VERSION}</div>
            <div className="inline-flex rounded-full border border-[#336699]/20 bg-[#336699]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#336699]">$5 / month add-on</div>
          </div>
        </header>
        <div className="mt-6"><OwnerCustomDomainsPanel /></div>
      </div>
    </main>
  );
}
