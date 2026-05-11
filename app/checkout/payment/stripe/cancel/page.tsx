import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function StorefrontStripeCancelPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const checkoutId = first(params.checkout_id).trim();
  let tenantSlug = "";
  if (checkoutId) {
    const { data: intent } = await db
      .from("storefront_payment_intents")
      .select("order_payload")
      .eq("id", checkoutId)
      .maybeSingle();
    const payload = intent?.order_payload as Record<string, unknown> | null;
    tenantSlug = typeof payload?.tenantSlug === "string" ? payload.tenantSlug.trim() : "";

    await db
      .from("storefront_payment_intents")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", checkoutId)
      .in("status", ["created", "checkout_started"]);
  }

  const storeUrl = tenantSlug ? `https://${tenantSlug}.orduva.com/` : "/";
  const checkoutUrl = tenantSlug ? `https://${tenantSlug}.orduva.com/checkout` : "/checkout";

  return (
    <main className="min-h-screen bg-[#fff7f0] px-4 py-8 text-slate-950 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-2xl overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="bg-gradient-to-br from-[#0E0E10] to-[#1f2328] px-6 py-8 text-white sm:px-8 sm:py-10">
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-3xl ring-1 ring-white/25">↩</div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-100">Payment cancelled</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">No payment was taken</h1>
          <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
            You returned from Stripe before completing payment. Your card has not been charged and no order has been placed.
          </p>
        </div>
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            Your basket has not been sent to the store yet. You can return to checkout and try again, or choose an available cash payment option if the store offers one.
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={checkoutUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800">Return to checkout</a>
            <a href={storeUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">Back to store</a>
          </div>
        </div>
      </section>
    </main>
  );
}
