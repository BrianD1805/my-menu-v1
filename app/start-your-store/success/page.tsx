import { LIVE_VERSION } from "@/lib/version";

type SearchValue = string | string[] | undefined;
type Props = {
  searchParams?: Promise<Record<string, SearchValue>>;
};

function safeText(value: SearchValue, fallback: string) {
  const text = Array.isArray(value) ? value[0] : value;
  return text && text.trim() ? text.trim() : fallback;
}

function emailStatusLabel(status: string) {
  if (status === "sent") return "Launch email sent successfully.";
  if (status === "skipped_email_not_configured") return "Launch email will be available once Orduva email is connected.";
  if (status === "failed") return "Email could not be sent automatically, so please keep these links safe.";
  return "Launch email prepared where email delivery is configured.";
}

export default async function StartYourStoreSuccessPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const name = safeText(params.name, "Your Orduva store");
  const slug = safeText(params.slug, "your-store");
  const ownerCreated = safeText(params.ownerCreated, "1") !== "0";
  const emailStatus = safeText(params.email, "queued");
  const storefrontUrl = `https://${slug}.orduva.com`;
  const adminUrl = `https://admin.orduva.com/admin/login?tenant=${encodeURIComponent(slug)}`;

  return (
    <main className="min-h-screen bg-[#FFF7F0] px-4 py-5 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[36px] border border-emerald-200 bg-white shadow-[0_28px_80px_rgba(14,14,16,0.12)]">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-[#FFF7F0] p-6 sm:p-9">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Store created successfully</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0E0E10] sm:text-6xl">Your store is ready.</h1>
                <p className="mt-4 text-base leading-8 text-[#5C5F66]">
                  {name} has been created on Orduva. Use the links below to view your new storefront and sign in to your admin area.
                </p>
              </div>
              <img src="/orduva-platform-icon-192.png" alt="Orduva" className="h-16 w-16 rounded-[22px] shadow-[0_16px_36px_rgba(14,14,16,0.16)]" />
            </div>

            <div className="mt-7 grid gap-4 lg:grid-cols-3">
              <div className="rounded-[26px] border border-[#0E0E10]/10 bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Store name</p>
                <p className="mt-2 text-xl font-black text-[#0E0E10]">{name}</p>
              </div>
              <div className="rounded-[26px] border border-[#0E0E10]/10 bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Store address</p>
                <p className="mt-2 break-all text-lg font-black text-[#0E0E10]">{slug}.orduva.com</p>
              </div>
              <div className="rounded-[26px] border border-[#0E0E10]/10 bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Owner login</p>
                <p className="mt-2 text-lg font-black text-[#0E0E10]">{ownerCreated ? "Created" : "Needs setup"}</p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <a href={storefrontUrl} target="_blank" rel="noreferrer" className="rounded-[26px] bg-[#0E0E10] px-5 py-5 text-white shadow-[0_16px_40px_rgba(14,14,16,0.22)] transition hover:-translate-y-0.5 hover:bg-[#252528] hover:shadow-[0_20px_48px_rgba(14,14,16,0.24)]">
                <span className="block text-sm font-black uppercase tracking-[0.16em] text-white/65">1. First step</span>
                <span className="mt-2 block text-xl font-black">View your new store →</span>
                <span className="mt-2 block break-all text-sm font-semibold text-white/70">{storefrontUrl}</span>
              </a>
              <a href={adminUrl} target="_blank" rel="noreferrer" className="rounded-[26px] bg-[#FF6A3D] px-5 py-5 text-white shadow-[0_16px_40px_rgba(255,106,61,0.28)] transition hover:-translate-y-0.5 hover:bg-[#E85C32] hover:shadow-[0_20px_48px_rgba(255,106,61,0.30)]">
                <span className="block text-sm font-black uppercase tracking-[0.16em] text-white/75">2. Manage setup</span>
                <span className="mt-2 block text-xl font-black">Sign in to manage your store →</span>
                <span className="mt-2 block break-all text-sm font-semibold text-white/75">admin.orduva.com/admin/login?tenant={slug}</span>
              </a>
            </div>
          </div>

          <div className="grid gap-0 border-t border-[#0E0E10]/10 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#C84F2A]">What to do next</p>
              <h2 className="mt-2 text-2xl font-black text-[#0E0E10]">Finish your launch setup</h2>
              <div className="mt-5 space-y-3 text-sm leading-6 text-[#4D535B]">
                {[
                  "Open your store address and check the starter storefront loads correctly.",
                  "Sign in to admin using the owner email and password you created.",
                  "Add your real categories, products, prices and product photos.",
                  "Upload your logo, review colours, and check your currency formatting.",
                  "Place one test order before sharing the store address with customers.",
                ].map((item, index) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-[#0E0E10]/10 bg-[#FFF7F0] px-4 py-3">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E0E10] text-xs font-black text-white">{index + 1}</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>
            <aside className="border-t border-[#0E0E10]/10 bg-[#0E0E10] p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FFB168]">Launch email</p>
              <h2 className="mt-2 text-2xl font-black">{emailStatusLabel(emailStatus)}</h2>
              <p className="mt-4 text-sm leading-7 text-white/70">
                The launch email includes your store address, admin sign-in link, and first setup steps. You can still use the links on this page immediately.
              </p>
              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-4 text-sm leading-6 text-white/75">
                <p className="font-black text-white">Keep this page open until you have checked both links.</p>
                <p className="mt-2">You can return to the Orduva home page when your store and admin links have been saved.</p>
              </div>
              <a href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-[#FFF7F0]">Back to Orduva home</a>
            </aside>
          </div>
        </section>
        <footer className="flex flex-col gap-3 px-2 py-5 text-sm text-[#68707A] sm:flex-row sm:items-center sm:justify-between">
          <p>Orduva client store onboarding success.</p>
          <p className="font-black text-[#0E0E10]">{LIVE_VERSION}</p>
        </footer>
      </div>
    </main>
  );
}
