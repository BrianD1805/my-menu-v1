"use client";

import { useEffect, useState } from "react";

export default function AffiliateLoginPanel() {
  const [email, setEmail] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [message, setMessage] = useState("Checking affiliate session...");
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedCode = window.sessionStorage.getItem("orduva_affiliate_partner_code");
    const savedKey = window.sessionStorage.getItem("orduva_affiliate_access_key");
    if (savedCode && savedKey) {
      window.location.replace("/affiliate/dashboard");
      return;
    }
    setChecking(false);
    setMessage("");
  }, []);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("Signing in...");
    try {
      const response = await fetch("/api/affiliate/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email, accessKey }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Affiliate login failed.");
      window.sessionStorage.setItem("orduva_affiliate_partner_code", data.partner.trackingCode);
      window.sessionStorage.setItem("orduva_affiliate_access_key", accessKey.trim());
      window.location.assign("/affiliate/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Affiliate login failed.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <section className="w-full max-w-md rounded-[30px] border border-[#0E0E10]/10 bg-white p-6 text-center shadow-[0_24px_70px_rgba(14,14,16,0.14)]">
        <img src="/orduva-platform-icon-192.png" alt="Orduva" className="mx-auto h-14 w-14 rounded-2xl shadow-[0_16px_34px_rgba(14,14,16,0.18)]" />
        <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#FF6A3D]">Orduva affiliate</p>
        <h1 className="mt-2 text-xl font-black tracking-tight">Checking affiliate access…</h1>
        <p className="mt-2 text-sm leading-6 text-[#5C5F66]">One moment while Orduva checks your saved affiliate session.</p>
      </section>
    );
  }

  return (
    <form onSubmit={signIn} className="w-full max-w-md overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.28)]">
      <div className="bg-[#0E0E10] px-5 py-6 text-white sm:px-7">
        <div className="flex items-center gap-4">
          <img src="/orduva-platform-icon-192.png" alt="Orduva" className="h-14 w-14 rounded-[20px] shadow-[0_16px_36px_rgba(0,0,0,0.35)]" />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FFB168]">Affiliate login</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">Orduva Affiliate</h1>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-white/72">Use the email address and login key supplied by Orduva after approval.</p>
      </div>
      <div className="space-y-4 bg-[#FFF7F0] px-5 py-6 text-[#0E0E10] sm:px-7">
        <label className="block">
          <span className="mb-2 block text-sm font-black">Email address</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-black">Affiliate login key</span>
          <input type="password" value={accessKey} onChange={(event) => setAccessKey(event.target.value)} required className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
        </label>
        {message ? <p className="rounded-2xl border border-[#FF6A3D]/25 bg-white px-4 py-3 text-sm font-bold text-[#C84F2A]">{message}</p> : null}
        <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_18px_40px_rgba(255,106,61,0.28)] transition hover:bg-[#e65f36] disabled:opacity-60">{busy ? "Signing in..." : "Sign in"}</button>
      </div>
    </form>
  );
}
