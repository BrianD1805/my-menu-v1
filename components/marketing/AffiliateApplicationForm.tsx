"use client";

import { useEffect, useState } from "react";
import { AFFILIATE_EARNING_REGIONS, AFFILIATE_PAYOUT_CURRENCIES } from "@/lib/affiliates";

type SubmitState = "idle" | "busy" | "success" | "error";

export default function AffiliateApplicationForm() {
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");
  const [formStartedAt] = useState(() => Date.now());
  const [refTenant, setRefTenant] = useState("");
  const [form, setForm] = useState({
    applicantName: "",
    email: "",
    phone: "",
    payoutCurrencyCode: "",
    earningRegion: "",
    earningRegionOther: "",
    websiteUrl: "",
    audienceNotes: "",
    promotionPlan: "",
    website: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const incomingRefTenant = (params.get("ref_tenant") || params.get("refTenant") || window.sessionStorage.getItem("orduva_ref_tenant") || "").trim().toLowerCase();
    setRefTenant(incomingRefTenant);
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "busy") return;
    setStatus("busy");
    setMessage("Submitting your application...");
    try {
      const response = await fetch("/api/public/affiliate-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ ...form, refTenant, formStartedAt, landingUrl: typeof window !== "undefined" ? window.location.href : "" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not submit affiliate application.");
      setStatus("success");
      setMessage("Application received. We’ll review it and send your approved affiliate link if it is a good fit.");
      setForm({ applicantName: "", email: "", phone: "", payoutCurrencyCode: "", earningRegion: "", earningRegionOther: "", websiteUrl: "", audienceNotes: "", promotionPlan: "", website: "" });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit affiliate application.");
    }
  }

  return (
    <form onSubmit={submitApplication} className="overflow-hidden rounded-[32px] border border-[#0E0E10]/10 bg-white shadow-[0_28px_80px_rgba(14,14,16,0.12)]">
      <div className="bg-[#0E0E10] px-5 py-6 text-white sm:px-7">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FFB168]">Affiliate application</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Apply to promote Orduva</h2>
        <p className="mt-3 text-sm leading-6 text-white/72">Approved affiliates receive 10% monthly commission on paid Orduva sales they introduce. If a tenant introduced you, that tenant can also receive a separate 5% monthly referral reward.</p>
      </div>

      <div className="grid gap-4 px-5 py-6 sm:px-7 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[#0E0E10]">Your name</span>
          <input value={form.applicantName} onChange={(e) => updateField("applicantName", e.target.value)} required className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[#0E0E10]">Email address</span>
          <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[#0E0E10]">Phone / WhatsApp</span>
          <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[#0E0E10]">Country / payout currency</span>
          <select value={form.payoutCurrencyCode} onChange={(e) => updateField("payoutCurrencyCode", e.target.value)} required className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20">
            <option value="">Select payout currency...</option>
            {AFFILIATE_PAYOUT_CURRENCIES.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} — {currency.label}</option>)}
          </select>
          <span className="mt-1 block text-xs font-bold text-[#5C5F66]">This becomes your affiliate payout currency.</span>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-black text-[#0E0E10]">Country/region you intend to earn from</span>
          <select value={form.earningRegion} onChange={(e) => updateField("earningRegion", e.target.value)} required className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20">
            <option value="">Select target region...</option>
            {AFFILIATE_EARNING_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
        </label>
        {form.earningRegion === "Other" ? (
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#0E0E10]">Please specify region</span>
            <input value={form.earningRegionOther} onChange={(e) => updateField("earningRegionOther", e.target.value)} required className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
          </label>
        ) : null}
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-black text-[#0E0E10]">Website / social page</span>
          <input value={form.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} placeholder="https://..." className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-black text-[#0E0E10]">Who would you promote Orduva to?</span>
          <textarea value={form.audienceNotes} onChange={(e) => updateField("audienceNotes", e.target.value)} required rows={4} className="w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
        </label>
        <label className="block md:col-span-2">
          <span className="mb-2 block text-sm font-black text-[#0E0E10]">How will you share Orduva?</span>
          <textarea value={form.promotionPlan} onChange={(e) => updateField("promotionPlan", e.target.value)} required rows={4} className="w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
        </label>
        <p className="md:col-span-2 rounded-2xl border border-[#0E0E10]/10 bg-[#F8FAFC] px-4 py-3 text-xs font-bold leading-5 text-[#5C5F66]">If a referred client pays in a different currency from your payout currency, the commission will need converting manually for now. Automatic exchange-rate conversion can be added later once we choose a reliable provider.</p>
        <input className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => updateField("website", e.target.value)} />
        {refTenant ? <p className="md:col-span-2 rounded-2xl border border-[#FF6A3D]/20 bg-[#FFF7F0] px-4 py-3 text-sm font-bold text-[#9A3412]">Application source: store referral.</p> : null}
        {message ? <p className={`md:col-span-2 rounded-2xl border px-4 py-3 text-sm font-bold ${status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[#FF6A3D]/25 bg-[#FFF7F0] text-[#C84F2A]"}`}>{message}</p> : null}
        <button type="submit" disabled={status === "busy"} className="md:col-span-2 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,106,61,0.28)] transition hover:bg-[#e65f36] disabled:cursor-not-allowed disabled:opacity-60">
          {status === "busy" ? "Submitting..." : "Submit affiliate application"}
        </button>
      </div>
    </form>
  );
}
