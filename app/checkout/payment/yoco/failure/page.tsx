import { db } from "@/lib/db";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function readPayloadTenantSlug(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  return typeof record.tenantSlug === "string" ? record.tenantSlug.trim() : "";
}

function buildStoreUrl(tenantSlug: string, path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!tenantSlug) return cleanPath;
  return `https://${tenantSlug}.orduva.com${cleanPath}`;
}

export default async function YocoFailurePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const checkoutId = first(params.checkout_id).trim();

  let storeUrl = "/";
  let checkoutUrl = "/checkout";

  if (checkoutId) {
    const { data: intent } = await db
      .from("storefront_payment_intents")
      .select("order_payload")
      .eq("id", checkoutId)
      .eq("provider", "yoco")
      .maybeSingle();

    const tenantSlug = readPayloadTenantSlug(intent?.order_payload);
    storeUrl = buildStoreUrl(tenantSlug, "/");
    checkoutUrl = buildStoreUrl(tenantSlug, "/checkout");

    await db
      .from("storefront_payment_intents")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", checkoutId)
      .eq("provider", "yoco")
      .is("order_id", null)
      .in("status", ["created", "checkout_started"]);
  }

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-xl rounded-[32px] border border-rose-100 bg-white p-6 text-center sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-3xl text-rose-700">!</div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-rose-700">Yoco payment failed</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Payment was not completed</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">The payment was not successful and no paid order has been sent to the store. You can return to checkout and try again.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={checkoutUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">Return to checkout</a>
          <a href={storeUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">Back to store</a>
        </div>
      </section>
    </main>
  );
}
