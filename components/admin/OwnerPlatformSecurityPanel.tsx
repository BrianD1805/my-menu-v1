"use client";

import { FormEvent, useEffect, useState } from "react";
import { useOwnerPlatformAccess } from "@/components/admin/OwnerPlatformAccessGate";

type SecurityStatus = {
  twoFactorEnabled: boolean;
  confirmedAt: string | null;
};

export default function OwnerPlatformSecurityPanel() {
  const ownerAccess = useOwnerPlatformAccess();
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [secret, setSecret] = useState("");
  const [otpUrl, setOtpUrl] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"info" | "success" | "error">("info");

  async function loadStatus() {
    if (!ownerAccess.unlocked) return;
    setLoading(true);
    try {
      const response = await fetch("/api/platform/security/status", {
        cache: "no-store",
        headers: ownerAccess.platformHeaders,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not load platform security status.");
      setStatus({ twoFactorEnabled: Boolean(data.twoFactorEnabled), confirmedAt: data.confirmedAt || null });
      setMessage(data.twoFactorEnabled ? "Authenticator security is enabled for platform pages." : "Authenticator security is not enabled yet.");
      setTone(data.twoFactorEnabled ? "success" : "info");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load platform security status.");
      setTone("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadStatus(); }, [ownerAccess.unlocked, ownerAccess.platformSessionToken]);

  async function startSetup() {
    setLoading(true);
    setMessage("Creating authenticator setup key...");
    setTone("info");
    try {
      const response = await fetch("/api/platform/security/setup/start", {
        method: "POST",
        headers: ownerAccess.platformHeaders,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not start authenticator setup.");
      setSecret(data.secret || "");
      setOtpUrl(data.otpauthUrl || "");
      setMessage("Add this setup key to Google Authenticator, then enter the 6-digit code to confirm.");
      setTone("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start authenticator setup.");
      setTone("error");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup(event: FormEvent) {
    event.preventDefault();
    const cleanCode = code.replace(/\D/g, "").slice(0, 6);
    if (cleanCode.length !== 6) {
      setMessage("Enter the 6-digit code from Google Authenticator.");
      setTone("error");
      return;
    }
    setLoading(true);
    setMessage("Confirming authenticator code...");
    setTone("info");
    try {
      const response = await fetch("/api/platform/security/setup/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...ownerAccess.platformHeaders },
        body: JSON.stringify({ code: cleanCode }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not confirm authenticator setup.");
      if (data.sessionToken) sessionStorage.setItem("orduvaOwnerPlatform2faSession", data.sessionToken);
      setSecret("");
      setOtpUrl("");
      setCode("");
      setMessage("Authenticator security is now enabled. Refreshing the owner session...");
      setTone("success");
      window.setTimeout(() => window.location.reload(), 650);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not confirm authenticator setup.");
      setTone("error");
    } finally {
      setLoading(false);
    }
  }

  const messageClass = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : tone === "error" ? "border-[#FF6A3D]/30 bg-[#FFF7F0] text-[#C84F2A]" : "border-[#0E0E10]/10 bg-white text-[#5C5F66]";

  return (
    <section className="rounded-[34px] border border-[#0E0E10]/10 bg-white/95 p-5 shadow-[0_24px_70px_rgba(14,14,16,0.10)] sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF6A3D]">Owner security</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0E0E10]">Authenticator 2FA</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5C5F66]">
            Add Google Authenticator, Microsoft Authenticator or Authy as a second check for all Orduva platform owner pages.
          </p>
        </div>
        <div className={["rounded-2xl px-4 py-3 text-sm font-black", status?.twoFactorEnabled ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"].join(" ")}> 
          {status?.twoFactorEnabled ? "2FA enabled" : "2FA not enabled"}
        </div>
      </div>

      {message ? <p className={["mt-5 rounded-2xl border px-4 py-3 text-sm font-bold", messageClass].join(" ")}>{message}</p> : null}

      {!status?.twoFactorEnabled ? (
        <div className="mt-6 space-y-5">
          {!secret ? (
            <button type="button" onClick={startSetup} disabled={loading} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FF6A3D] px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,61,0.24)] transition hover:bg-[#e65f36] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Preparing..." : "Set up authenticator"}
            </button>
          ) : (
            <form onSubmit={confirmSetup} className="space-y-5 rounded-[28px] border border-[#0E0E10]/10 bg-[#FFF7F0] p-4 sm:p-5">
              <div>
                <p className="text-sm font-black text-[#0E0E10]">Manual setup key</p>
                <p className="mt-2 break-all rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3 font-mono text-sm font-black tracking-[0.08em] text-[#0E0E10]">{secret}</p>
                <p className="mt-2 text-xs leading-5 text-[#5C5F66]">
                  In Google Authenticator, choose Add code, then Enter setup key. Account name: Orduva Owner Platform. Key type: Time based.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#0E0E10]">Confirm 6-digit code</span>
                <input inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="min-h-12 w-full rounded-2xl border border-[#0E0E10]/15 bg-white px-4 py-3 text-center text-2xl font-black tracking-[0.35em] outline-none transition focus:border-[#FF6A3D] focus:ring-2 focus:ring-[#FF6A3D]/20" />
              </label>

              <button type="submit" disabled={loading} className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0E0E10] px-5 py-3 text-sm font-black text-white transition hover:bg-[#252528] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Confirming..." : "Enable authenticator security"}
              </button>

              {otpUrl ? <p className="break-all rounded-2xl border border-[#0E0E10]/10 bg-white px-4 py-3 text-[11px] leading-5 text-[#5C5F66]">Advanced authenticator URI: {otpUrl}</p> : null}
            </form>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900 sm:p-5">
          Platform owner pages now require the owner key and a 6-digit authenticator code. Confirmed at: <span className="font-black">{status.confirmedAt ? new Date(status.confirmedAt).toLocaleString() : "enabled"}</span>.
        </div>
      )}

      <div className="mt-6 rounded-[28px] border border-[#0E0E10]/10 bg-[#F5F2EE] p-4 text-xs leading-6 text-[#5C5F66] sm:p-5">
        Recovery note: keep the setup key somewhere safe. If the phone is lost, disable 2FA directly in Supabase by setting <span className="font-mono font-black">platform_security.totp_enabled = false</span>, then set it up again.
      </div>
    </section>
  );
}
