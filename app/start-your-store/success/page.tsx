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
  if (status === "sent") return "Your launch email has been sent.";
  if (status === "skipped_email_not_configured") return "Your store is ready. Orduva email delivery is still being configured.";
  if (status === "failed") return "Your store is ready, but the launch email could not be sent automatically.";
  return "Your launch email has been prepared.";
}

export default async function StartYourStoreSuccessPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const name = safeText(params.name, "Your Orduva store");
  const slug = safeText(params.slug, "your-store");
  const ownerCreated = safeText(params.ownerCreated, "1") !== "0";
  const emailStatus = safeText(params.email, "queued");
  const adminUrl = `https://admin.orduva.com/admin/login?tenant=${encodeURIComponent(slug)}`;

  return (
    <main className="min-h-screen bg-[#FFF7F0] px-4 py-6 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="overflow-hidden rounded-[36px] border border-emerald-200 bg-white shadow-[0_28px_80px_rgba(14,14,16,0.12)]">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-[#FFF7F0] p-6 text-center sm:p-10">
            <img src="/orduva-platform-icon-192.png" alt="Orduva" className="mx-auto h-16 w-16 rounded-[22px] shadow-[0_16px_36px_rgba(14,14,16,0.16)]" />
            <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Store created successfully</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0E0E10] sm:text-6xl">Your store is ready.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#5C5F66]">
              Your Orduva store has been created. Sign in to your admin area to finish the launch setup checklist.
            </p>

            <div className="mt-7 grid gap-4 text-left sm:grid-cols-2">
              <div className="rounded-[26px] border border-[#0E0E10]/10 bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Store name</p>
                <p className="mt-2 text-xl font-black text-[#0E0E10]">{name}</p>
              </div>
              <div className="rounded-[26px] border border-[#0E0E10]/10 bg-white/90 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Store address</p>
                <p className="mt-2 break-all text-lg font-black text-[#0E0E10]">{slug}.orduva.com</p>
              </div>
            </div>

            <div className="mt-4 rounded-[26px] border border-[#0E0E10]/10 bg-white/90 p-5 text-left shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C84F2A]">Confirmation</p>
              <p className="mt-2 text-sm leading-7 text-[#5C5F66]">
                Owner login: <span className="font-black text-[#0E0E10]">{ownerCreated ? "Created" : "Needs setup"}</span>
              </p>
              <p className="mt-1 text-sm leading-7 text-[#5C5F66]">
                Email status: <span className="font-black text-[#0E0E10]">{emailStatusLabel(emailStatus)}</span>
              </p>
            </div>

            <a
              href={adminUrl}
              className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-[24px] bg-[#FF6A3D] px-6 py-4 text-base font-black text-white shadow-[0_18px_44px_rgba(255,106,61,0.30)] transition hover:-translate-y-0.5 hover:bg-[#E85C32] sm:w-auto"
            >
              Continue to your admin setup →
            </a>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#5C5F66]">
              The setup checklist appears at the top of the admin login page and continues inside your admin area.
            </p>
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
