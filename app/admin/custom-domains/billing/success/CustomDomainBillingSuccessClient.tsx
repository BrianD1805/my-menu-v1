"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CustomDomainBillingSuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id") || "";
  const domainId = params.get("domain_id") || "";
  const domain = params.get("domain") || "custom domain";
  const [state, setState] = useState<"checking" | "paid" | "pending" | "error">("checking");
  const [message, setMessage] = useState("Checking your Stripe payment status…");

  const canCheck = useMemo(() => Boolean(sessionId && domainId), [sessionId, domainId]);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!canCheck) {
        setState("error");
        setMessage("The Stripe return link is missing the checkout reference. Open Store Admin Settings and refresh the custom domain section.");
        return;
      }

      try {
        const response = await fetch("/api/admin/custom-domains/stripe-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, domainId }),
        });
        const payload = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) throw new Error(payload?.error || "Could not verify Stripe payment.");
        if (payload?.paid) {
          setState("paid");
          setMessage("Payment confirmed. Your custom domain add-on is active and DNS setup can continue.");
        } else {
          setState("pending");
          setMessage("Stripe has not returned a fully paid subscription yet. Refresh Store Admin Settings in a moment or wait for the webhook to finish.");
        }
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setMessage(err instanceof Error ? err.message : "Could not verify Stripe payment.");
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [canCheck, domainId, sessionId]);

  return (
    <main className="min-h-screen bg-[#F3F7FA] px-4 py-10 text-[#0E0E10]">
      <section className="mx-auto max-w-2xl rounded-[32px] border border-[#0E0E10]/10 bg-white p-6 shadow-[0_18px_54px_rgba(14,14,16,0.08)] sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#336699]">
          Custom domain billing
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">
          {state === "paid" ? "Payment confirmed" : state === "error" ? "Payment check needed" : "Checking payment"}
        </h1>
        <p className="mt-3 text-sm font-bold text-[#5C5F66]">
          Domain: <span className="break-all text-[#0E0E10]">{domain}</span>
        </p>
        <p
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold leading-6 ${
            state === "paid"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : state === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {message}
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
