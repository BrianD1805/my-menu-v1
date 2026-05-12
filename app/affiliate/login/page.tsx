import AffiliateLoginPanel from "@/components/affiliate/AffiliateLoginPanel";

export const metadata = {
  title: "Orduva Affiliate Login",
  manifest: "/affiliate/manifest.webmanifest",
};

export default function AffiliateLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0E0E10] px-4 py-8 text-white">
      <AffiliateLoginPanel />
    </main>
  );
}
