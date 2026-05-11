import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function StorefrontStripeSuccessPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const sessionId = first(params.session_id).trim();
  let order: Record<string, any> | null = null;

  if (sessionId) {
    const { data } = await db
      .from("orders")
      .select("id,total,payment_status,payment_method_label,created_at")
      .eq("payment_checkout_session_id", sessionId)
      .maybeSingle();
    order = data || null;
  }

  const paid = order?.payment_status === "paid";

  return (
    <main className="min-h-screen bg-[#fff7f0] px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="bg-gradient-to-br from-[#0E0E10] to-[#1f2328] px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl ring-1 ring-white/25">✓</div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-100">Secure payment</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Payment received</h1>
          <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
            Thank you. Stripe has returned you to Orduva after payment. Once Stripe confirms the payment, Orduva creates the order and sends it to the store.
          </p>
        </div>
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className={`rounded-3xl border p-5 ${paid ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950"}`}>
            <p className="text-sm font-black uppercase tracking-[0.14em]">{paid ? "Confirmed" : "Final confirmation pending"}</p>
            <p className="mt-2 text-sm leading-6">
              {paid
                ? "The order has been created and marked as paid in Orduva."
                : "Your payment was sent to Stripe. If this page loaded before the webhook arrived, Orduva may still be creating the paid order for a few seconds."}
            </p>
          </div>

          <dl className="mt-5 grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">Order reference</dt><dd className="font-black text-slate-950">{order?.id ? String(order.id).slice(0, 8) : "Checking"}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">Payment status</dt><dd className="font-black text-slate-950">{order?.payment_status || "Waiting"}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="text-slate-500">Payment method</dt><dd className="font-black text-slate-950">{order?.payment_method_label || "Stripe card payment"}</dd></div>
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">Return to store</Link>
            <Link href="/checkout" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">Back to checkout</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
