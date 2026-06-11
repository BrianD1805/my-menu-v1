import { db } from "@/lib/db";
import { buildTenantBranding, getTenantSettings } from "@/lib/tenant-settings";
import { formatMoney } from "@/lib/money";

export default async function PreOrderBalancePage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const { data: order } = await db
    .from("orders")
    .select("id,tenant_id,customer_name,preorder_balance_amount,preorder_balance_payment_status,preorder_balance_requested_at")
    .eq("id", orderId)
    .maybeSingle();

  const settings = order?.tenant_id ? await getTenantSettings(order.tenant_id) : null;
  const branding = buildTenantBranding("", "Orduva", settings);
  const balance = Number(order?.preorder_balance_amount || 0);
  const paid = order?.preorder_balance_payment_status === "paid";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">Pre-order balance</p>
        <h1 className="mt-3 text-3xl font-black">{paid ? "Balance already paid" : "Your stock has arrived"}</h1>
        {order ? (
          <div className="mt-5 space-y-4">
            <p className="text-sm leading-6 text-slate-600">Hello {order.customer_name || "there"}. Your pre-order balance is ready to be paid.</p>
            <div className="rounded-3xl bg-teal-50 p-5 ring-1 ring-teal-100">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Balance due</p>
              <p className="mt-2 text-4xl font-black text-slate-950">{formatMoney(balance, branding)}</p>
            </div>
            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Online balance payment is prepared for this order flow. For this build, contact the store if the payment button is not yet connected for your payment provider.
            </p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-slate-600">This pre-order balance link could not be found.</p>
        )}
      </section>
    </main>
  );
}
