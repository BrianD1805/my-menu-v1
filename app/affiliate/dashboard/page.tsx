import AffiliateDashboardPanel from "@/components/affiliate/AffiliateDashboardPanel";
import { LIVE_VERSION } from "@/lib/version";

export const metadata = {
  title: "Orduva Affiliate Dashboard",
  manifest: "/affiliate/manifest.webmanifest",
};

export default function AffiliateDashboardPage() {
  return (
    <main className="min-h-screen bg-[#FFF7F0] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <AffiliateDashboardPanel />
        <p className="mt-6 text-center text-[11px] font-black uppercase tracking-[0.18em] text-[#5C5F66]">{LIVE_VERSION}</p>
      </div>
    </main>
  );
}
