import Link from "next/link";
import { LIVE_VERSION } from "@/lib/version";
import { formatPlanPrice } from "@/lib/pricing";
import { loadTenantBillingStatus, retrieveStripeCheckoutSession } from "@/lib/stripe-status";

type SearchValue = string | string[] | undefined;
type Props = { searchParams?: Promise<Record<string, SearchValue>> };

function safeText(value: SearchValue, fallback = "") {
  const text = Array.isArray(value) ? value[0] : value;
  return text && text.trim() ? text.trim() : fallback;
}

function labelText(value: string) {
  return value ? value.replace(/_/g, " ") : "Selected";
}

function statusTone(active: boolean) {
  return active
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-[#FFB168]/55 bg-[#FFF7F0] text-[#B74A16]";
}

export default async function StripeBillingSuccessPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const sessionId = safeText(params.session_id, "");
  const session = sessionId ? await retrieveStripeCheckoutSession(sessionId) : null;
  const tenant = session?.tenantId ? await loadTenantBillingStatus(session.tenantId) : null;

  const tenantSlug = session?.tenantSlug || safeText(params.tenant, tenant?.slug || "your-store");
  const plan = session?.planCode || safeText(params.plan, "selected");
  const currency = session?.currencyCode || safeText(params.currency, "");
  const billing = session?.billingInterval || safeText(params.billing, "monthly");
  const amount = session?.amountTotal ? formatPlanPrice(session.amountTotal, session.currencyCode, { forceDecimals: billing === "monthly" }) : "";
  const stripeComplete = session?.status === "complete" || session?.paymentStatus === "paid" || session?.paymentStatus === "no_payment_required";
  const orduvaActive = tenant?.subscriptionStatus === "active" || tenant?.trialStatus === "converted";

  return (
    <main className="min-h-screen bg-[#FFF7F0] px-4 py-8 text-[#1F2328] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <section className="w-full overflow-hidden rounded-[34px] border border-[#E8D8C8] bg-white shadow-[0_30px_90px_rgba(81,55,45,0.14)]">
          <div className="border-b border-[#E8D8C8]/80 px-6 py-5 sm:px-8">
            <img src="/orduva-logo-hero-updated.png" alt="Orduva" className="h-10 w-auto" />
          </div>
          <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
            <p className="mx-auto inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Stripe checkout complete</p>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-[#0E0E10] sm:text-4xl">
              {orduvaActive ? "Your Orduva subscription is active." : "Thank you — your plan is being activated."}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#5C5F66] sm:text-base">
              Stripe returned successfully for <span className="font-black text-[#0E0E10]">{tenantSlug}</span>. This page now checks the Stripe session and Orduva tenant record so you can confirm whether the webhook has completed the activation step.
            </p>

            <div className="mx-auto mt-6 grid max-w-xl gap-3 rounded-[26px] border border-[#E8D8C8] bg-[#FFF8EF] p-4 text-left text-sm sm:grid-cols-3">
              <div><p className="font-black text-[#B74A16]">Plan</p><p className="mt-1 capitalize text-[#0E0E10]">{labelText(String(plan))}</p></div>
              <div><p className="font-black text-[#B74A16]">Billing</p><p className="mt-1 capitalize text-[#0E0E10]">{labelText(String(billing))}</p></div>
              <div><p className="font-black text-[#B74A16]">Amount</p><p className="mt-1 text-[#0E0E10]">{amount || currency || "Selected"}</p></div>
            </div>

            <div className="mx-auto mt-4 grid max-w-xl gap-3 text-left text-sm sm:grid-cols-2">
              <div className={`rounded-[22px] border px-4 py-3 ${statusTone(stripeComplete)}`}>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-75">Stripe session</p>
                <p className="mt-1 text-lg font-black">{session?.status || "Not checked"}</p>
                <p className="mt-1 text-xs font-bold">Payment: {session?.paymentStatus || "not available"}</p>
              </div>
              <div className={`rounded-[22px] border px-4 py-3 ${statusTone(orduvaActive)}`}>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-75">Orduva tenant</p>
                <p className="mt-1 text-lg font-black">{orduvaActive ? "Active" : "Waiting for webhook"}</p>
                <p className="mt-1 text-xs font-bold">Subscription: {tenant?.subscriptionStatus || "not available"}</p>
              </div>
            </div>

            {!orduvaActive ? (
              <p className="mx-auto mt-4 max-w-xl rounded-2xl border border-[#FFB168]/45 bg-[#FFF7F0] px-4 py-3 text-sm font-bold leading-6 text-[#9A4219]">
                This can take a short moment while Stripe sends the webhook. Refresh this page, or return to admin and use the subscription status check in the billing/trial popup.
              </p>
            ) : null}

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/admin" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:bg-[#E85C32]">Return to admin</Link>
              <Link href={sessionId ? `/billing/success?session_id=${encodeURIComponent(sessionId)}&tenant=${encodeURIComponent(tenantSlug)}&plan=${encodeURIComponent(String(plan))}&currency=${encodeURIComponent(String(currency))}&billing=${encodeURIComponent(String(billing))}` : "/billing/success"} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#0E0E10]/10 bg-white px-5 py-3 text-sm font-black text-[#0E0E10] transition hover:bg-[#F5F2EE]">Refresh status</Link>
            </div>
            <p className="mt-6 text-xs font-bold text-[#68707A]">{LIVE_VERSION}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
