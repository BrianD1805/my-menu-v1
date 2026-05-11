import Link from "next/link";
import { LIVE_VERSION } from "@/lib/version";

type SearchValue = string | string[] | undefined;
type Props = { searchParams?: Promise<Record<string, SearchValue>> };

function safeText(value: SearchValue, fallback = "") {
  const text = Array.isArray(value) ? value[0] : value;
  return text && text.trim() ? text.trim() : fallback;
}

function labelText(value: string) {
  return value ? value.replace(/_/g, " ") : "Selected";
}

export default async function StripeBillingCancelPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const tenant = safeText(params.tenant, "your store");
  const plan = safeText(params.plan, "selected");
  const currency = safeText(params.currency, "selected");
  const billing = safeText(params.billing, "monthly");

  return (
    <main className="min-h-screen bg-[#FFF7F0] px-4 py-8 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-[34px] border border-[#E8D8C8] bg-white shadow-[0_30px_90px_rgba(81,55,45,0.14)]">
          <div className="border-b border-[#E8D8C8]/80 px-6 py-5 sm:px-8">
            <img src="/orduva-logo-hero-updated.png" alt="Orduva" className="h-10 w-auto" />
          </div>
          <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
            <p className="mx-auto inline-flex rounded-full border border-[#FFB168]/50 bg-[#FFF7F0] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#B74A16]">Checkout cancelled</p>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-[#0E0E10] sm:text-4xl">No payment was taken.</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5C5F66] sm:text-base">
              Stripe checkout was cancelled for <span className="font-black text-[#0E0E10]">{tenant}</span>. The Orduva plan was not changed, and the store remains in its previous trial or subscription state.
            </p>
            <div className="mx-auto mt-6 grid max-w-xl gap-3 rounded-[26px] border border-[#E8D8C8] bg-[#FFF8EF] p-4 text-left text-sm sm:grid-cols-3">
              <div><p className="font-black text-[#B74A16]">Plan</p><p className="mt-1 capitalize text-[#0E0E10]">{labelText(plan)}</p></div>
              <div><p className="font-black text-[#B74A16]">Billing</p><p className="mt-1 capitalize text-[#0E0E10]">{labelText(billing)}</p></div>
              <div><p className="font-black text-[#B74A16]">Currency</p><p className="mt-1 text-[#0E0E10]">{currency.toUpperCase()}</p></div>
            </div>
            <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3 text-sm font-bold leading-6 text-[#5C5F66]">
              No subscription changes were made. You can return to admin, review the plan selection, and continue to secure checkout again when ready.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:bg-[#E85C32]">Return to admin</Link>
            </div>
            <p className="mt-6 text-xs font-bold text-[#68707A]">{LIVE_VERSION}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
