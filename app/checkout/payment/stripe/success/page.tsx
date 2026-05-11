import StripeSuccessStatusClient from "./StripeSuccessStatusClient";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function StorefrontStripeSuccessPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const sessionId = first(params.session_id).trim();

  return (
    <main className="min-h-screen bg-[#fff7f0] px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="bg-gradient-to-br from-[#0E0E10] to-[#1f2328] px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl ring-1 ring-white/25">✓</div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-100">Secure payment</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Payment received</h1>
          <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
            Thank you. Stripe has returned you to Orduva after payment. We are confirming the order and sending it to the store.
          </p>
        </div>
        <StripeSuccessStatusClient sessionId={sessionId} />
      </section>
    </main>
  );
}
