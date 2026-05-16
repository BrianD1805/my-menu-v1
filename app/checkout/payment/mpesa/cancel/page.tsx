import Link from "next/link";
import { db } from "@/lib/db";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? String(value[0] || "") : String(value || "");
}

function readTenantSlug(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;
  return typeof record.tenantSlug === "string" ? record.tenantSlug.trim() : "";
}

function buildStoreUrl(tenantSlug: string, path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (!tenantSlug) return cleanPath;
  return `https://${tenantSlug}.orduva.com${cleanPath}`;
}

export default async function MpesaPaymentCancelPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const checkoutId = first(params.checkout_id).trim();
  let tenantSlug = "";

  if (checkoutId) {
    const { data } = await db.from("storefront_payment_intents").select("id,tenant_id,order_payload").eq("id", checkoutId).eq("provider", "mpesa").maybeSingle();
    tenantSlug = readTenantSlug((data as Record<string, unknown> | null)?.order_payload);
    await db.from("storefront_payment_intents").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", checkoutId).eq("provider", "mpesa").is("order_id", null);
  }

  const checkoutUrl = buildStoreUrl(tenantSlug, "/checkout");
  const storeUrl = buildStoreUrl(tenantSlug, "/");

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-xl rounded-[32px] border border-amber-100 bg-white p-6 text-center sm:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-3xl text-amber-700">×</div>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-amber-700">M-Pesa payment</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">No payment was taken</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Your basket has not been sent to the store yet. You can return to checkout and try again, or choose another available payment option.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={checkoutUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-50">Back to checkout</Link>
          <Link href={storeUrl} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">Back to store</Link>
        </div>
      </section>
    </main>
  );
}
