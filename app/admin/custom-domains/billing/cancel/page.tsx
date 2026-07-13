import Link from "next/link";

export default function CustomDomainBillingCancelPage() {
  return (
    <main className="min-h-screen bg-[#F3F7FA] px-4 py-10 text-[#0E0E10]">
      <section className="mx-auto max-w-2xl rounded-[32px] border border-[#0E0E10]/10 bg-white p-6 shadow-[0_18px_54px_rgba(14,14,16,0.08)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#336699]">
          Custom domain billing
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          Payment was cancelled
        </h1>
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-800">
          The custom domain add-on has not been activated. You can return to Store Admin Settings and start the Stripe payment again when ready.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin/settings"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white transition hover:bg-[#252528]"
          >
            Back to Store Admin Settings
          </Link>
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-[#F3F7FA]"
          >
            Store Admin Home
          </Link>
        </div>
      </section>
    </main>
  );
}
