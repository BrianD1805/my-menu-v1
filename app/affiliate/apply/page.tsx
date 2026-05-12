import AffiliateApplicationForm from "@/components/marketing/AffiliateApplicationForm";
import { LIVE_VERSION } from "@/lib/version";
import Link from "next/link";

export const metadata = {
  title: "Apply to become an Orduva affiliate",
  description: "Apply to promote Orduva and earn approved monthly affiliate commission.",
  manifest: "/affiliate/manifest.webmanifest",
};

export default function AffiliateApplyPage() {
  return (
    <main className="min-h-screen bg-[#FFF7F0] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-[34px] border border-[#0E0E10]/10 bg-white/90 p-5 text-center shadow-[0_28px_80px_rgba(14,14,16,0.12)] sm:p-7">
          <img src="/orduva-platform-icon-192.png" alt="Orduva" className="mx-auto h-16 w-16 rounded-[22px] shadow-[0_16px_36px_rgba(14,14,16,0.16)]" />
          <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-[#FF6A3D]">Orduva affiliates</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0E0E10] sm:text-5xl">Earn by introducing new Orduva clients.</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[#5C5F66] sm:text-base">Approved affiliates receive a dedicated link and a separate affiliate dashboard. Commission is owner-approved and based on paid Orduva subscriptions.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-bold text-[#0E0E10] transition hover:bg-[#F5F2EE]">Public home</Link>
            <Link href="/affiliate/login" className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#252528]">Affiliate login</Link>
          </div>
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#5C5F66]">{LIVE_VERSION}</p>
        </header>
        <AffiliateApplicationForm />
      </div>
    </main>
  );
}
